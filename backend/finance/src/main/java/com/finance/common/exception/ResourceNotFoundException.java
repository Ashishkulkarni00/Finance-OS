package com.finance.common.exception;

/** The requested resource does not exist, or does not belong to the current user. */
public class ResourceNotFoundException extends FinanceException {

    public ResourceNotFoundException(ErrorCode code, String message) {
        super(code, message);
    }

    public ResourceNotFoundException(ErrorCode code, String message, String field) {
        super(code, message, field, null);
    }
}
