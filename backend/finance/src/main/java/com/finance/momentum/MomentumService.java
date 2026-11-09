package com.finance.momentum;

import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CycleSnapshotRepository;
import com.finance.cycle.domain.CycleSnapshot;
import com.finance.forecast.ForecastMonth;
import com.finance.forecast.ForecastService;
import com.finance.forecast.ForecastUnlock;
import com.finance.insight.Wording;
import com.finance.loan.LoanService;
import com.finance.loan.LoanView;
import com.finance.loan.domain.LoanStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Momentum - named directions with reasons, no score (ROADMAP 6.3).
 *
 * <p>Not a health score, not a streak (both on the not-building list): a handful of
 * plain-language directions, each with the facts behind it, so the reader can see which way
 * things are moving without being graded. A direction that can't be known says so and says
 * what would make it knowable - usually recording something - because an encouraging line
 * built on missing data is the most comfortable possible lie.
 *
 * <h2>Directions</h2>
 * <ul>
 *   <li><strong>Debt</strong> - principal repaid since tracking began, from recorded EMIs.
 *       Unrecorded EMIs make it unknowable, and it says how many.</li>
 *   <li><strong>The next thing to finish</strong> - the next bill to end, from the forecast.
 *       Always knowable, and the one direction a spreadsheet can't show.</li>
 *   <li><strong>Net worth, promises kept</strong> - from closed months ({@code CycleSnapshot}).
 *       Needs two closed months to have a direction at all.</li>
 * </ul>
 * Read-only. The snapshots are history by design; everything else is derived.
 */
@Service
public class MomentumService {

    public enum Direction { BETTER, WORSE, STEADY, UNKNOWN }

    /** @param name a direction's plain name - "Debt", never a metric label */
    public record Item(String key, String name, Direction direction, String headline, String reason) {
    }

    private final LoanService loanService;
    private final ForecastService forecastService;
    private final CycleSnapshotRepository snapshots;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public MomentumService(LoanService loanService, ForecastService forecastService, CycleSnapshotRepository snapshots,
                           CurrentUserProvider currentUser, Clock clock) {
        this.loanService = loanService;
        this.forecastService = forecastService;
        this.snapshots = snapshots;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Item> current() {
        LocalDate today = LocalDate.now(clock);
        List<Item> out = new ArrayList<>();
        debt(today).ifPresent(out::add);
        nextToFinish(today).ifPresent(out::add);
        out.addAll(fromSnapshots());
        return out;
    }

    private java.util.Optional<Item> debt(LocalDate today) {
        List<LoanView> loans = loanService.list(Pageable.unpaged()).getContent().stream()
                .filter(l -> l.loan().getStatus() != LoanStatus.CLOSED)
                .toList();
        if (loans.isEmpty()) {
            return java.util.Optional.of(new Item("debt", "Debt", Direction.STEADY, "No loans open.", null));
        }
        int unrecorded = loans.stream().mapToInt(LoanView::unrecordedEmis).sum();
        BigDecimal repaid = MoneyScale.ZERO;
        LocalDate since = null;
        for (LoanView l : loans) {
            BigDecimal start = l.loan().getOutstandingBalance();
            BigDecimal now = l.outstandingPrincipal();
            if (start != null && now != null) {
                repaid = repaid.add(start.subtract(now).max(BigDecimal.ZERO));
            }
            LocalDate asOf = l.loan().getBalanceAsOf();
            if (asOf != null && (since == null || asOf.isBefore(since))) {
                since = asOf;
            }
        }
        String from = since == null ? "since you started tracking" : "since " + Wording.date(since, today);
        if (unrecorded > 0) {
            return java.util.Optional.of(new Item("debt", "Debt", Direction.UNKNOWN,
                    unrecorded + (unrecorded == 1 ? " EMI has" : " EMIs have") + " fallen due with nothing recorded.",
                    "Debt is almost certainly coming down, but this won't say so until the payments are recorded - "
                            + (repaid.signum() > 0 ? Wording.money(repaid) + " repaid " + from + " is what's on record." : "nothing repaid is on record " + from + ".")));
        }
        return java.util.Optional.of(new Item("debt", "Debt", repaid.signum() > 0 ? Direction.BETTER : Direction.STEADY,
                repaid.signum() > 0 ? Wording.money(repaid) + " of principal repaid " + from + "." : "No principal repaid yet " + from + ".",
                "From the EMIs you've recorded against each loan."));
    }

    private java.util.Optional<Item> nextToFinish(LocalDate today) {
        for (ForecastMonth m : forecastService.forecast(24).months()) {
            if (!m.unlocks().isEmpty()) {
                ForecastUnlock u = m.unlocks().get(0);
                String more = m.unlocks().size() > 1 ? " (and " + (m.unlocks().size() - 1) + " more)" : "";
                return java.util.Optional.of(new Item("next-finish", "Next to finish", Direction.BETTER,
                        u.name() + more + " ends - " + Wording.money(u.amount()) + " a month comes back from "
                                + Wording.date(m.cycleStart(), today) + ".",
                        "Carried forward from the plan as it stands, if every payment until then is made."));
            }
        }
        return java.util.Optional.empty();
    }

    private List<Item> fromSnapshots() {
        List<CycleSnapshot> closed = snapshots.findByUserIdOrderByCreatedAtAsc(currentUser.currentUserId());
        if (closed.size() < 2) {
            return List.of(new Item("history", "Month to month", Direction.UNKNOWN,
                    closed.isEmpty() ? "No month closed yet." : "One month closed so far.",
                    "Net worth and promises kept get a direction once two months are closed - closing a month is what records it."));
        }
        CycleSnapshot prev = closed.get(closed.size() - 2);
        CycleSnapshot last = closed.get(closed.size() - 1);
        List<Item> out = new ArrayList<>();

        BigDecimal change = last.getNetWorth().subtract(prev.getNetWorth());
        out.add(new Item("net-worth", "Net worth", direction(change),
                change.signum() == 0 ? "Unchanged across the last two closed months."
                        : (change.signum() > 0 ? "Up " : "Down ") + Wording.money(change.abs()) + " between the last two closed months.",
                "What you own less what you owe, as recorded when each month closed."));

        if (last.getCommitmentsPlanned() != null && last.getCommitmentsKept() != null
                && prev.getCommitmentsPlanned() != null && prev.getCommitmentsKept() != null
                && last.getCommitmentsPlanned() > 0 && prev.getCommitmentsPlanned() > 0) {
            // Compared as shares, not counts: a month with more bills isn't a month kept better.
            BigDecimal a = BigDecimal.valueOf(prev.getCommitmentsKept()).divide(BigDecimal.valueOf(prev.getCommitmentsPlanned()), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal b = BigDecimal.valueOf(last.getCommitmentsKept()).divide(BigDecimal.valueOf(last.getCommitmentsPlanned()), 4, java.math.RoundingMode.HALF_UP);
            out.add(new Item("kept", "Promises kept", direction(b.subtract(a)),
                    last.getCommitmentsKept() + " of " + last.getCommitmentsPlanned() + " last month, against "
                            + prev.getCommitmentsKept() + " of " + prev.getCommitmentsPlanned() + " the month before.",
                    "Bills and savings made as planned. Money coming in isn't counted - it isn't a promise."));
        }
        return out;
    }

    private static Direction direction(BigDecimal change) {
        int s = change.signum();
        return s > 0 ? Direction.BETTER : s < 0 ? Direction.WORSE : Direction.STEADY;
    }
}
