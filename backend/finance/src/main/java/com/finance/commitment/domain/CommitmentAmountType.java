package com.finance.commitment.domain;

/** Whether a commitment's amount is known up front, or only discovered each cycle. */
public enum CommitmentAmountType {

    /** A fixed EMI, rent, subscription - the same figure every cycle. */
    FIXED,

    /** A variable bill (electricity, a card statement) - unknown until confirmed. */
    VARIABLE
}
