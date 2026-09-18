package com.finance.loan.domain;

/**
 * How much of this loan's terms came from paperwork rather than memory.
 *
 * <p>The source workbook's Loans sheet states the rule this exists to enforce:
 * <em>"Nothing here is invented. Where a real figure has not been supplied the cell says
 * TBD and the Confidence column says so."</em>
 *
 * <p>This is not a label. It <strong>gates the derived figures</strong>: the amortisation
 * calculator will happily produce an outstanding principal and a payoff date from any
 * numbers in the row, and presenting those as fact when the inputs were a guess is
 * exactly the confidently-wrong behaviour ADR-0006 forbids. At {@link #TBD} the derived
 * figures are withheld rather than shown.
 */
public enum LoanConfidence {

    /** Terms taken from the sanction letter or statement. Derived figures are sound. */
    CONFIRMED,

    /** Derived from what the user stated ("3.1 years remaining"). Close, not exact. */
    ESTIMATED,

    /** Key terms have never been supplied. Nothing may be derived from them. */
    TBD;

    /** Whether an outstanding principal and payoff date may be presented as fact. */
    public boolean supportsDerivedFigures() {
        return this != TBD;
    }
}
