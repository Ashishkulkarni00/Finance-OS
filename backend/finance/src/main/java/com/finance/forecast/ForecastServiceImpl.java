package com.finance.forecast;

import com.finance.commitment.CommitmentBucket;
import com.finance.commitment.CommitmentBucketClassifier;
import com.finance.commitment.CommitmentInstanceGenerator;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Walks forward from the current cycle, one salary month at a time, reusing exactly the
 * rule engine the real month uses ({@code CommitmentInstanceGenerator.occursIn/dueDateWithin}
 * against {@code CommitmentRepository.findActiveForCycle}) and the same bucket
 * classification ({@code CommitmentBucketClassifier}) - deliberately not a second engine
 * (STRATEGY_DEEP_DIVE §I1). No {@code CommitmentInstance} rows are created; the {@link Cycle}
 * for each forecast month is a transient object built purely from date arithmetic, never
 * persisted, never given an id.
 *
 * <p>Only commitments participate - a loan or card EMI with no linked bill is invisible
 * here, exactly as it is to Real Balance and the month's shape today (FIX_BACKLOG 1.2/3.1).
 * That is a known, shared limitation, not a divergence introduced by forecasting.
 */
@Service
public class ForecastServiceImpl implements ForecastService {

    /** A ridiculous horizon compounds assumptions into noise (STRATEGY_DEEP_DIVE §V) - capped, not trusted past this. */
    private static final int MAX_MONTHS = 24;

    private final CommitmentRepository commitmentRepository;
    private final CommitmentInstanceGenerator generator;
    private final CommitmentBucketClassifier bucketClassifier;
    private final CycleService cycleService;
    private final CurrentUserProvider currentUser;

    public ForecastServiceImpl(CommitmentRepository commitmentRepository,
                               CommitmentInstanceGenerator generator,
                               CommitmentBucketClassifier bucketClassifier,
                               CycleService cycleService,
                               CurrentUserProvider currentUser) {
        this.commitmentRepository = commitmentRepository;
        this.generator = generator;
        this.bucketClassifier = bucketClassifier;
        this.cycleService = cycleService;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional(readOnly = true)
    public ForecastResult forecast(int months) {
        int horizon = Math.max(1, Math.min(months, MAX_MONTHS));
        Long userId = currentUser.currentUserId();
        Cycle anchor = cycleService.resolveCurrent();

        List<ForecastMonth> result = new ArrayList<>();
        // The previous month's spoken-for bills (PAYMENT/SET_ASIDE only), so a bill that
        // stops recurring this month - its last occurrence was in that one - shows as an
        // unlock. Null before the first month, since there is nothing before it in scope.
        Map<Long, Commitment> previousSpokenFor = null;
        LocalDate previousStart = null;

        for (int i = 0; i < horizon; i++) {
            LocalDate start = anchor.getStartDate().plusMonths(i);
            // Every cycle is exactly one calendar month long (CycleCalculator) - safe to
            // step this way because cycleStartDay is constrained to 1-28 at the database
            // level, so every month can host it.
            LocalDate end = start.plusMonths(1).minusDays(1);
            Cycle cycle = Cycle.builder().userId(userId).startDate(start).endDate(end).build();

            BigDecimal income = BigDecimal.ZERO;
            BigDecimal committed = BigDecimal.ZERO;
            BigDecimal setAside = BigDecimal.ZERO;
            int unknown = 0;
            Map<Long, Commitment> spokenFor = new LinkedHashMap<>();
            List<ForecastAnnualItem> annualItems = new ArrayList<>();

            for (Commitment commitment : commitmentRepository.findActiveForCycle(userId, start, end)) {
                if (!generator.occursIn(commitment, cycle)) {
                    continue;
                }
                CommitmentBucket bucket = bucketClassifier.classify(commitment);
                if (bucket == CommitmentBucket.NEITHER) {
                    continue;
                }
                BigDecimal amount = commitment.getAmountType() == CommitmentAmountType.FIXED
                        ? commitment.getFixedAmount() : null;
                if (amount == null) {
                    unknown++;
                } else {
                    switch (bucket) {
                        case INCOME -> income = income.add(amount);
                        case PAYMENT -> committed = committed.add(amount);
                        case SET_ASIDE -> setAside = setAside.add(amount);
                        case NEITHER -> { }
                    }
                }
                if (bucket == CommitmentBucket.PAYMENT || bucket == CommitmentBucket.SET_ASIDE) {
                    spokenFor.put(commitment.getId(), commitment);
                }
                if (commitment.getFrequency() != CommitmentFrequency.MONTHLY) {
                    annualItems.add(new ForecastAnnualItem(commitment.getId(), commitment.getName(), amount,
                            generator.dueDateWithin(commitment, cycle)));
                }
            }

            List<ForecastUnlock> unlocks = unlocksFrom(previousSpokenFor, spokenFor, previousStart);

            boolean noIncome = income.signum() == 0;
            BigDecimal flexible = noIncome ? null : income.subtract(committed).subtract(setAside);

            result.add(new ForecastMonth(start, end, income, committed, setAside, flexible, unknown, unlocks, annualItems));

            previousSpokenFor = spokenFor;
            previousStart = start;
        }

        return new ForecastResult(result);
    }

    /**
     * A bill that was spoken-for last month and isn't this month unlocks money here - but
     * only when it genuinely ended (its {@code activeTo} falls inside last month), not
     * merely skipped a month because it's quarterly or annual.
     */
    private List<ForecastUnlock> unlocksFrom(Map<Long, Commitment> previous, Map<Long, Commitment> current, LocalDate previousStart) {
        if (previous == null) {
            return List.of();
        }
        LocalDate previousEnd = previousStart.plusMonths(1).minusDays(1);
        List<ForecastUnlock> unlocks = new ArrayList<>();
        for (Commitment commitment : previous.values()) {
            if (current.containsKey(commitment.getId())) {
                continue;
            }
            LocalDate endedOn = commitment.getActiveTo();
            if (endedOn == null || endedOn.isBefore(previousStart) || endedOn.isAfter(previousEnd)) {
                continue; // still open-ended - just not due this cycle (quarterly/annual)
            }
            if (commitment.getAmountType() != CommitmentAmountType.FIXED) {
                continue; // nothing certain to say is now free
            }
            if (isOneOff(commitment)) {
                continue; // a single planned event finishing isn't recurring capacity freeing up
            }
            unlocks.add(new ForecastUnlock(commitment.getId(), commitment.getName(), commitment.getFixedAmount(),
                    bucketClassifier.classify(commitment)));
        }
        return unlocks;
    }

    /**
     * A "just once" bill (PLANNED_CHANGES.md): a MONTHLY rule whose whole window is one
     * salary cycle. Its end is never an unlock - it was a single planned event, not a
     * recurring cost freeing up capacity. Same ~31-day threshold the frontend uses
     * ({@code isOneOff} in commitmentForm.ts) so the two can't disagree about what counts.
     */
    private boolean isOneOff(Commitment commitment) {
        if (commitment.getFrequency() != CommitmentFrequency.MONTHLY || commitment.getActiveTo() == null) {
            return false;
        }
        long days = java.time.temporal.ChronoUnit.DAYS.between(commitment.getActiveFrom(), commitment.getActiveTo());
        return days >= 0 && days <= 31;
    }
}
