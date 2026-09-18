package com.finance.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Stable, machine-readable error identifiers.
 *
 * <p>The frontend switches on {@code code}, never on {@code message}. Messages are
 * user-facing copy and will change; codes are a contract.
 */
public enum ErrorCode {

    // --- generic ---------------------------------------------------------
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND),
    CONCURRENT_MODIFICATION(HttpStatus.CONFLICT),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),

    // --- account ---------------------------------------------------------
    ACCOUNT_NOT_FOUND(HttpStatus.NOT_FOUND),
    ACCOUNT_NAME_TAKEN(HttpStatus.CONFLICT),
    ACCOUNT_ARCHIVED(HttpStatus.UNPROCESSABLE_CONTENT),
    ACCOUNT_TYPE_IMMUTABLE(HttpStatus.UNPROCESSABLE_CONTENT),
    OPENING_DATE_IN_FUTURE(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- category ----------------------------------------------------------
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND),
    CATEGORY_NAME_TAKEN(HttpStatus.CONFLICT),
    CATEGORY_ARCHIVED(HttpStatus.UNPROCESSABLE_CONTENT),
    /** Sub-categories go exactly one level deep - a child can't itself become a parent,
     *  and a category with children can't be moved under a third one. See V12. */
    CATEGORY_NESTING_TOO_DEEP(HttpStatus.UNPROCESSABLE_CONTENT),
    /** The category still has sub-categories under it, so it can't be deleted. */
    CATEGORY_HAS_CHILDREN(HttpStatus.UNPROCESSABLE_CONTENT),
    /** A category can't be its own parent. */
    CATEGORY_PARENT_IS_SELF(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- transaction -------------------------------------------------------
    TRANSACTION_NOT_FOUND(HttpStatus.NOT_FOUND),
    TRANSFER_SAME_ACCOUNT(HttpStatus.UNPROCESSABLE_CONTENT),
    DESTINATION_REQUIRED(HttpStatus.UNPROCESSABLE_CONTENT),
    DESTINATION_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_CONTENT),
    CATEGORY_REQUIRED(HttpStatus.UNPROCESSABLE_CONTENT),
    CATEGORY_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_CONTENT),
    /** The account can't fund this kind of movement - e.g. an expense charged against
     *  a loan account, which isn't a wallet you spend from. LEDGER_IMPROVEMENT_PLAN §2 P1. */
    ACCOUNT_NOT_ELIGIBLE(HttpStatus.UNPROCESSABLE_CONTENT),
    /** The destination can't receive this kind of movement - e.g. a transfer into an
     *  account type nothing can be moved into. */
    DESTINATION_NOT_ELIGIBLE(HttpStatus.UNPROCESSABLE_CONTENT),
    /** The category's own group doesn't match the transaction's direction - an income
     *  category on an expense, or vice versa. LEDGER_IMPROVEMENT_PLAN §2 P2. */
    CATEGORY_WRONG_DIRECTION(HttpStatus.UNPROCESSABLE_CONTENT),
    POSTINGS_UNBALANCED(HttpStatus.UNPROCESSABLE_CONTENT),
    IDEMPOTENCY_CONFLICT(HttpStatus.CONFLICT),

    // --- reservation ---------------------------------------------------------
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND),
    RESERVATION_EXCEEDS_BALANCE(HttpStatus.UNPROCESSABLE_CONTENT),
    ACCOUNT_NOT_SPENDABLE(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- cycle -----------------------------------------------------------
    CYCLE_NOT_FOUND(HttpStatus.NOT_FOUND),
    CYCLE_ALREADY_CLOSED(HttpStatus.CONFLICT),
    CYCLE_NOT_YET_ENDED(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- commitment --------------------------------------------------------
    COMMITMENT_NOT_FOUND(HttpStatus.NOT_FOUND),
    COMMITMENT_INACTIVE(HttpStatus.UNPROCESSABLE_CONTENT),
    FIXED_AMOUNT_REQUIRED(HttpStatus.UNPROCESSABLE_CONTENT),
    FIXED_AMOUNT_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_CONTENT),
    COMMITMENT_INSTANCE_NOT_FOUND(HttpStatus.NOT_FOUND),
    COMMITMENT_AMOUNT_UNKNOWN(HttpStatus.UNPROCESSABLE_CONTENT),
    CONFIRMATION_WRONG_CYCLE(HttpStatus.UNPROCESSABLE_CONTENT),
    VERIFICATION_REQUIRED(HttpStatus.UNPROCESSABLE_CONTENT),
    INSTANCE_ALREADY_SETTLED(HttpStatus.CONFLICT),
    /** The transaction being linked already settles a different occurrence - rule 4. */
    TRANSACTION_ALREADY_LINKED(HttpStatus.CONFLICT),
    INSTANCE_NOT_SKIPPABLE(HttpStatus.UNPROCESSABLE_CONTENT),
    LOAN_HAS_NO_PAY_FROM(HttpStatus.UNPROCESSABLE_CONTENT),
    SOURCE_ALREADY_LINKED(HttpStatus.CONFLICT),
    SOURCE_NOT_SUPPORTED(HttpStatus.UNPROCESSABLE_CONTENT),
    SETTLE_TYPE_MISMATCH(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- goal --------------------------------------------------------------
    GOAL_NOT_FOUND(HttpStatus.NOT_FOUND),
    GOAL_MULTIPLE_LINKS_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- import ------------------------------------------------------------
    IMPORT_NOT_FOUND(HttpStatus.NOT_FOUND),
    IMPORT_ALREADY_COMMITTED(HttpStatus.CONFLICT),
    IMPORT_ROW_INVALID(HttpStatus.UNPROCESSABLE_CONTENT),

    // --- user ------------------------------------------------------------
    USER_NOT_FOUND(HttpStatus.NOT_FOUND);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
