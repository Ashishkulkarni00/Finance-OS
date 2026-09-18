package com.finance.loan.domain;

/** Whether EMIs are debited from a bank account or billed to a credit card. */
public enum LoanPaidVia {

    BANK,

    /** Card-billed EMIs are flagged so they do not double-count as cash outflow. */
    CARD
}
