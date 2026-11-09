package com.finance.goal;

import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.insight.Wording;
import com.finance.loan.LoanService;
import com.finance.loan.LoanView;
import com.finance.loan.domain.LoanStatus;
import com.finance.state.Runway;
import com.finance.state.RunwayCalculator;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A suggested order for where spare money goes, and where this user stands on it - ROADMAP
 * 5.3 ("reserve before investing, debt before wealth", as a <em>suggested</em> order, never
 * enforced).
 *
 * <p>The order is the conventional one, for reasons each step states rather than asserts:
 * <ol>
 *   <li><strong>A month of must-pay bills within reach</strong> - without it, the next surprise
 *       goes on a card, at the rate step 2 is trying to clear.</li>
 *   <li><strong>Debt above {@value #HIGH_RATE_PERCENT}%</strong> - no ordinary saving or
 *       investment reliably beats it, and repaying it is a guaranteed return.</li>
 *   <li><strong>Three months within reach</strong> - the full cushion: a job gap or a medical
 *       bill is survivable without borrowing.</li>
 *   <li><strong>Goals with a date</strong> - judged by {@link GoalFeasibilityService}.</li>
 *   <li><strong>Then low-rate debt or investing</strong> - a matter of taste and risk, so the
 *       product states the break-even and stops.</li>
 * </ol>
 * The 12% line is the same one {@code RateMismatchRule} uses, so two screens can't disagree
 * about what "expensive" means.
 *
 * <p>Nothing is blocked by it and nothing is ranked by it elsewhere: someone saving for a
 * wedding while carrying a card balance has made a choice, and this is the map, not a verdict
 * (rule 8, D8). Read-only, nothing stored.
 */
@Service
public class SuggestedOrderService {

    static final int HIGH_RATE_PERCENT = 12;
    private static final BigDecimal HIGH_RATE = BigDecimal.valueOf(HIGH_RATE_PERCENT);

    public enum Status { DONE, IN_PROGRESS, NOT_STARTED, UNKNOWN }

    /** @param current true on the first step that isn't done - "you are here" */
    public record Step(String key, String title, String why, Status status, String detail, boolean current) {
    }

    private final RunwayCalculator runwayCalculator;
    private final CurrentCycleResolver cycleResolver;
    private final CurrentUserProvider currentUser;
    private final LoanService loanService;
    private final GoalFeasibilityService feasibility;
    private final Clock clock;

    public SuggestedOrderService(RunwayCalculator runwayCalculator, CurrentCycleResolver cycleResolver,
                                 CurrentUserProvider currentUser, LoanService loanService,
                                 GoalFeasibilityService feasibility, Clock clock) {
        this.runwayCalculator = runwayCalculator;
        this.cycleResolver = cycleResolver;
        this.currentUser = currentUser;
        this.loanService = loanService;
        this.feasibility = feasibility;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Step> steps() {
        Runway runway = runwayCalculator.calculateAhead(
                cycleResolver.resolve(currentUser.currentUserId(), LocalDate.now(clock)), cycleResolver);
        BigDecimal months = runway.isKnown() ? runway.months() : null;

        List<LoanView> active = loanService.list(Pageable.unpaged()).getContent().stream()
                .filter(l -> l.loan().getStatus() != LoanStatus.CLOSED)
                .toList();
        List<LoanView> dear = active.stream()
                .filter(l -> l.loan().getAnnualRate() != null && l.loan().getAnnualRate().compareTo(HIGH_RATE) >= 0)
                .toList();
        List<LoanView> cheap = active.stream()
                .filter(l -> l.loan().getAnnualRate() != null && l.loan().getAnnualRate().compareTo(HIGH_RATE) < 0)
                .toList();
        long unrated = active.stream().filter(l -> l.loan().getAnnualRate() == null).count();

        List<Step> raw = new ArrayList<>();
        raw.add(buffer("buffer-1", "A month of must-pay bills within reach",
                "Without it, the next surprise goes on a card - at the rate the next step is trying to clear.",
                months, BigDecimal.ONE, runway));
        raw.add(debt(dear, unrated));
        raw.add(buffer("buffer-3", "Three months within reach",
                "The full cushion: a job gap or a medical bill becomes survivable without borrowing.",
                months, BigDecimal.valueOf(3), runway));
        raw.add(goals());
        raw.add(cheapDebt(cheap));

        List<Step> out = new ArrayList<>();
        boolean found = false;
        for (Step s : raw) {
            boolean current = !found && s.status() != Status.DONE && s.status() != Status.UNKNOWN;
            found |= current;
            out.add(new Step(s.key(), s.title(), s.why(), s.status(), s.detail(), current));
        }
        return out;
    }

    private static Step buffer(String key, String title, String why, BigDecimal months, BigDecimal need, Runway runway) {
        if (months == null) {
            return new Step(key, title, why, Status.UNKNOWN, runway.unknownReason(), false);
        }
        String have = "Reachable money covers " + months.stripTrailingZeros().toPlainString()
                + (months.compareTo(BigDecimal.ONE) == 0 ? " month" : " months") + " of must-pay bills ("
                + Wording.money(runway.monthlyEssentials()) + " a month)"
                + (runway.upperBound() ? " - at most, since some bills have no amount yet" : "") + ".";
        if (months.compareTo(need) >= 0) {
            // "At most" only matters near the line: two unpriced bills can't plausibly eat half a
            // month of must-pay bills, but they could tip 1.1 below 1. Without this, 2.5 months
            // with an electricity bill unpriced left the user parked on step 1 indefinitely.
            boolean thin = runway.upperBound() && months.subtract(need).compareTo(new BigDecimal("0.5")) < 0;
            return new Step(key, title, why, thin ? Status.IN_PROGRESS : Status.DONE, have, false);
        }
        BigDecimal missing = MoneyScale.normalise(runway.monthlyEssentials().multiply(need).subtract(runway.liquidTotal()));
        return new Step(key, title, why, months.signum() > 0 ? Status.IN_PROGRESS : Status.NOT_STARTED,
                have + " About " + Wording.money(missing) + " more gets there.", false);
    }

    private static Step debt(List<LoanView> dear, long unrated) {
        String title = "Clear debt above " + HIGH_RATE_PERCENT + "%";
        String why = "No ordinary saving reliably earns more than this costs, and every rupee repaid is a guaranteed return at its rate.";
        if (dear.isEmpty()) {
            return new Step("debt-high", title, why, unrated > 0 ? Status.UNKNOWN : Status.DONE,
                    unrated > 0 ? unrated + " loan" + (unrated == 1 ? " has" : "s have") + " no rate recorded, so this can't be judged."
                            : "No loan charges " + HIGH_RATE_PERCENT + "% or more.", false);
        }
        BigDecimal total = MoneyScale.ZERO;
        StringBuilder names = new StringBuilder();
        for (LoanView l : dear) {
            BigDecimal owed = l.outstandingPrincipal() != null ? l.outstandingPrincipal() : l.loan().getOutstandingBalance();
            if (owed != null) {
                total = total.add(owed);
            }
            if (!names.isEmpty()) {
                names.append(", ");
            }
            names.append(l.account() != null ? l.account().getName() : l.loan().getLender())
                    .append(" (").append(l.loan().getAnnualRate().stripTrailingZeros().toPlainString()).append("%)");
        }
        return new Step("debt-high", title, why, Status.IN_PROGRESS,
                Wording.money(total) + " still owed across " + names + ".", false);
    }

    private Step goals() {
        String title = "Fund goals with a date";
        String why = "Once the cushion and the dear debt are handled, money can go to what you're saving for without being borrowed back.";
        List<GoalFeasibility> all = feasibility.assess();
        if (all.isEmpty()) {
            return new Step("goals", title, why, Status.DONE, "No open goals.", false);
        }
        long fine = all.stream().filter(f -> f.state() == GoalFeasibility.State.FITS
                || f.state() == GoalFeasibility.State.COVERED_BY_PLAN).count();
        long maybe = all.stream().filter(f -> f.state() == GoalFeasibility.State.FITS_IF).count();
        long notFit = all.stream().filter(f -> f.state() == GoalFeasibility.State.DOES_NOT_FIT).count();
        // "0 of 2 fit" read as failure when both fitted with a condition attached - name each group.
        List<String> parts = new ArrayList<>();
        if (fine > 0) parts.add(fine + " fit" + (fine == 1 ? "s" : ""));
        if (maybe > 0) parts.add(maybe + " fit" + (maybe == 1 ? "s" : "") + " if things go as usual or better");
        if (notFit > 0) parts.add(notFit + " can't be met by " + (notFit == 1 ? "its date" : "their dates") + " as planned");
        long rest = all.size() - fine - maybe - notFit;
        if (rest > 0) parts.add(rest + " can't be judged yet");
        String detail = "Of " + all.size() + (all.size() == 1 ? " goal: " : " goals: ") + String.join(", ", parts) + ".";
        return new Step("goals", title, why, fine == all.size() ? Status.DONE : Status.IN_PROGRESS, detail, false);
    }

    private static Step cheapDebt(List<LoanView> cheap) {
        String title = "Then: low-rate debt, or investing";
        if (cheap.isEmpty()) {
            return new Step("debt-low", title, "A matter of taste and risk - with no cheap debt, investing is the open question.",
                    Status.NOT_STARTED, "No loan below " + HIGH_RATE_PERCENT + "%.", false);
        }
        LoanView top = cheap.stream().max((a, b) -> a.loan().getAnnualRate().compareTo(b.loan().getAnnualRate())).orElseThrow();
        String name = top.account() != null ? top.account().getName() : top.loan().getLender();
        return new Step("debt-low", title,
                "A matter of taste and risk. Prepaying is a certain return at the loan's rate; investing might beat it, or not.",
                Status.NOT_STARTED,
                "To beat prepaying " + name + ", an investment would need more than "
                        + top.loan().getAnnualRate().stripTrailingZeros().toPlainString() + "% a year after tax, with certainty.", false);
    }
}
