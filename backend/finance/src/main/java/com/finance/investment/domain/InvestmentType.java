package com.finance.investment.domain;

/** What kind of holding this is. An enum rather than free text so the register can group
 *  and label consistently - the same reasoning as {@code AccountType} (ADR-0008). */
public enum InvestmentType {

    MUTUAL_FUND_SIP("Mutual fund SIP"),
    MUTUAL_FUND_LUMPSUM("Mutual fund"),
    RECURRING_DEPOSIT("Recurring deposit"),
    FIXED_DEPOSIT("Fixed deposit"),
    EPF("Provident fund"),
    PPF("PPF"),
    NPS("NPS"),
    STOCKS("Stocks"),
    GOLD("Gold"),
    OTHER("Other");

    private final String label;

    InvestmentType(String label) {
        this.label = label;
    }

    /** Plain language, never SCREAMING_CASE - DESIGN_SYSTEM's voice rule. */
    public String label() {
        return label;
    }
}
