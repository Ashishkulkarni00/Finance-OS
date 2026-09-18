package com.finance.card.domain;

/** Where a statement's bill stands today - derived from payments since the statement, never stored. */
public enum StatementStatus {
    /** Payments and credits since the statement cover its total. */
    PAID,
    /** Something is still to pay and the due date hasn't passed. */
    DUE,
    /** Something is still to pay and the due date has passed. */
    OVERDUE
}
