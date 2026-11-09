package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Finds fixed-amount bills whose last two payments both differed from the plan in the same
 * direction - ROADMAP 3.1's "subscription drift", in the shape the data can actually prove.
 *
 * <p><strong>Why it was parked, and why it can be built now.</strong> On 2026-09-25 it needed
 * history that didn't exist. It still can't detect a <em>new</em> subscription - that needs
 * months of ledger - but it doesn't need to: the common, costly case is a plan that's out of
 * date. A ₹1,000 WiFi bill that has been ₹1,180 twice is ₹180 a month the forecast, the day
 * rate and every goal verdict are all quietly overstating.
 *
 * <p><strong>Two in a row, same direction, both material</strong> (≥ {@value #MIN_PERCENT}% and
 * ≥ ₹{@value #MIN_RUPEES}) - the same "a run is a habit, a one-off is noise" rule as
 * {@link PlanAccountDriftCalculator}. A payment matching the plan breaks the run, so updating
 * the plan (or the price going back) clears it. Variable bills have no plan amount to drift
 * from and are skipped.
 */
@Component
public class PlanAmountDriftCalculator {

    static final int MIN_PERCENT = 5;
    static final int MIN_RUPEES = 50;

    private final CommitmentInstanceRepository instances;

    public PlanAmountDriftCalculator(CommitmentInstanceRepository instances) {
        this.instances = instances;
    }

    public List<PlanAmountDrift> forCommitments(List<Commitment> commitments, Long userId) {
        List<PlanAmountDrift> out = new ArrayList<>();
        for (Commitment c : commitments) {
            BigDecimal planned = c.getFixedAmount();
            if (c.getAmountType() != CommitmentAmountType.FIXED || planned == null || planned.signum() <= 0) {
                continue;
            }
            List<BigDecimal> paid = new ArrayList<>(2);
            java.time.LocalDate lastOn = null;
            for (CommitmentInstance i : instances.findTop6ByCommitmentIdAndUserIdAndDueDateLessThanEqualOrderByDueDateDesc(c.getId(), userId, java.time.LocalDate.now())) {
                if (i.getStatus() != CommitmentInstanceStatus.PAID || i.getConfirmedAmount() == null) {
                    continue; // unpaid says nothing about the price
                }
                if (lastOn == null) {
                    lastOn = i.getDueDate();
                }
                paid.add(i.getConfirmedAmount());
                if (paid.size() == 2) {
                    break;
                }
            }
            if (paid.size() < 2) {
                continue;
            }
            BigDecimal latest = paid.get(0);
            BigDecimal previous = paid.get(1);
            int dirA = latest.compareTo(planned);
            int dirB = previous.compareTo(planned);
            if (dirA == 0 || dirA != dirB || !material(latest, planned) || !material(previous, planned)) {
                continue;
            }
            out.add(new PlanAmountDrift(c.getId(), c.getName(), planned, latest, previous, lastOn));
        }
        return out;
    }

    private static boolean material(BigDecimal paid, BigDecimal planned) {
        BigDecimal diff = paid.subtract(planned).abs();
        return diff.compareTo(BigDecimal.valueOf(MIN_RUPEES)) >= 0
                && diff.multiply(BigDecimal.valueOf(100)).divide(planned, 2, RoundingMode.HALF_UP)
                        .compareTo(BigDecimal.valueOf(MIN_PERCENT)) >= 0;
    }
}
