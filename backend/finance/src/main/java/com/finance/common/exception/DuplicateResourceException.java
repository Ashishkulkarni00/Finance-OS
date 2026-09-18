package com.finance.common.exception;

/** A resource with the same natural key already exists for this user. */
public class DuplicateResourceException extends FinanceException {

    public DuplicateResourceException(ErrorCode code, String message, String field) {
        super(code, message, field, null);
    }
}
