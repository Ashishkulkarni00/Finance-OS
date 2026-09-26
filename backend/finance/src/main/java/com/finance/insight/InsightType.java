package com.finance.insight;

/** What kind of thing an insight is about. The UI may pick an icon by it; wording is server-side. */
public enum InsightType {
    /** An account won't cover the payments leaving it before salary. */
    SHORTFALL,
    /** A payment's date has passed and nothing was recorded. */
    OVERDUE,
    /** A payment is due today, tomorrow or the day after. */
    DUE_SOON,
    /** A must-pay bill has no amount, so what's free is only an upper limit. */
    NEEDS_AMOUNT,
    /** A payment was linked but doesn't match (amount or account). */
    NEEDS_REVIEW,
    /** A payment was recorded but waits for confirmation. */
    UNVERIFIED,
    /** Expected income hasn't been recorded after its day. */
    INCOME_LATE,
    /** A planned transfer or investment (savings, a top-up) wasn't recorded by its day. */
    PLANNED_ITEM_MISSED,
    /** A credit card bill is due within a few days and not fully paid. */
    CARD_BILL_DUE,
    /** A credit card bill's due date has passed with money still owed. */
    CARD_BILL_OVERDUE,
    /** The top goal is behind its pace or past its date. */
    GOAL_BEHIND,
    /** A goal is funded by a bill with no set amount, so its pace cannot be judged at all. */
    GOAL_FUNDING_UNCLEAR,
    /** Money is set aside while debt costing more than it can earn is still running. */
    RATE_MISMATCH
}
