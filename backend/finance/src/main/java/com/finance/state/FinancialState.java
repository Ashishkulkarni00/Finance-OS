package com.finance.state;

import com.finance.commitment.CycleShape;
import com.finance.cycle.domain.Cycle;
import com.finance.position.NetWorthResult;
import com.finance.position.PositionResult;

import java.time.LocalDate;

/**
 * One object spanning the whole position ({@code FINANCIAL_STATE.md}, ROADMAP 2.1).
 *
 * <p>Until now the closest thing to a financial state was {@code PositionResult}: one
 * cycle's spendable cash. Debt, assets, obligations and safety were separate reads with
 * nothing relating them, so no engine could reason across them and every screen assembled
 * its own picture. This is that picture, assembled once.
 *
 * <p><strong>It is a composition, not a new source of truth.</strong> Every figure here is
 * produced by the calculator that already owns it — position, cycle shape, net worth, loans —
 * plus the three this phase adds: {@link Runway}, {@link SpendBaseline} and
 * {@link DebtPosition}. Derived on every read, never stored (ADR-0011). If a figure here ever
 * disagrees with the screen that shows it, the composition is wrong, not the calculator.
 *
 * <p><strong>Completeness is inherited, not recomputed.</strong> {@code position.complete()}
 * already refuses to answer when a mandatory bill has no amount (ADR-0006), and that refusal
 * propagates: runway is null for the same reason, by the same rule. A state object that
 * reported "incomplete" while still printing a confident Real Balance would defeat the
 * contract it is meant to carry.
 *
 * @param asOf          the date every figure was computed for
 * @param cycle         the salary month in force
 * @param daysToSalary  days until the next salary date — the denominator behind Room
 * @param position      Real Balance, Room and their breakdown
 * @param shape         this cycle: in, committed, set aside, flexible
 * @param netWorth      assets, liabilities and the difference
 * @param runway        how long the reachable money covers mandatory obligations
 * @param baseline      the user's own usual day-to-day spending; unknown early on
 * @param debt          every loan as one position
 * @param attentionCount how many things currently need the user — the same engine the toast
 *                       and Needs you read, so the three can never disagree
 */
public record FinancialState(
        LocalDate asOf,
        Cycle cycle,
        int daysToSalary,
        PositionResult position,
        CycleShape shape,
        NetWorthResult netWorth,
        Runway runway,
        SpendBaseline baseline,
        DebtPosition debt,
        int attentionCount
) {

    /** The whole object's honesty flag: false when any mandatory amount is still unknown. */
    public boolean complete() {
        return position != null && position.complete();
    }
}
