package com.finance.insight;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.card.CreditCardService;
import com.finance.commitment.CommitmentInstanceService;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.goal.GoalService;
import com.finance.projection.ProjectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The one place that decides what needs the user - replacing the warnings each screen used
 * to invent for itself (Today's Needs you, the goal card, Month's Needs you).
 *
 * <p>Ranking, deliberately simple and explainable: severity first (money lost if nothing
 * happens, then things needing attention, then opportunities), then the earliest date, then
 * the larger rupee amount. Each surface shows a few; the rest are counted, not hidden.
 */
@Service
public class InsightService {

    private static final Logger log = LoggerFactory.getLogger(InsightService.class);

    /** How many each surface shows before "and N more". */
    public static int limitFor(Insight.Surface surface) {
        return surface == Insight.Surface.TODAY ? 3 : 5;
    }

    private final List<InsightRule> rules;
    private final CycleService cycleService;
    private final CommitmentInstanceService instanceService;
    private final AccountService accountService;
    private final ProjectionService projectionService;
    private final CreditCardService creditCardService;
    private final GoalService goalService;
    private final Clock clock;

    public InsightService(List<InsightRule> rules, CycleService cycleService, CommitmentInstanceService instanceService,
                          AccountService accountService, ProjectionService projectionService,
                          CreditCardService creditCardService, GoalService goalService, Clock clock) {
        this.rules = rules;
        this.cycleService = cycleService;
        this.instanceService = instanceService;
        this.accountService = accountService;
        this.projectionService = projectionService;
        this.creditCardService = creditCardService;
        this.goalService = goalService;
        this.clock = clock;
    }

    public record Result(List<Insight> shown, int total) {
    }

    // Not read-only: listing the cycle's rows generates any missing ones, as every other
    // reader of the plan does.
    @Transactional
    public Result forSurface(Insight.Surface surface) {
        FinancialContext context = buildContext();
        Map<String, Insight> byKey = new LinkedHashMap<>();
        for (InsightRule rule : rules) {
            for (Insight insight : rule.evaluate(context)) {
                if (insight.surfaces().contains(surface)) {
                    byKey.putIfAbsent(insight.key(), insight);
                }
            }
        }
        List<Insight> ranked = new ArrayList<>(byKey.values());
        ranked.sort(Comparator.comparingInt((Insight i) -> i.severity().ordinal())
                .thenComparing(i -> i.when() == null ? LocalDate.MAX : i.when())
                .thenComparing((Insight i) -> i.impact() == null ? java.math.BigDecimal.ZERO : i.impact(),
                        Comparator.reverseOrder()));
        int limit = limitFor(surface);
        return new Result(ranked.subList(0, Math.min(limit, ranked.size())), ranked.size());
    }

    private FinancialContext buildContext() {
        LocalDate today = LocalDate.now(clock);
        Cycle cycle = cycleService.resolveCurrent();
        List<FinancialContext.AccountProjection> projections = new ArrayList<>();
        for (Account account : accountService.listActive()) {
            if (!account.countsAsSpendable()) {
                continue;
            }
            try {
                projections.add(new FinancialContext.AccountProjection(account, projectionService.projectAccount(account.getId())));
            } catch (RuntimeException e) {
                // One account that can't be projected mustn't hide every other insight.
                log.warn("Insight context: projection skipped accountId={} reason={}", account.getId(), e.getClass().getSimpleName());
            }
        }
        return new FinancialContext(today, cycle, instanceService.listForCycle(cycle.getId()), projections,
                creditCardService.list().cards(), goalService.list(false, Pageable.unpaged()).getContent());
    }
}
