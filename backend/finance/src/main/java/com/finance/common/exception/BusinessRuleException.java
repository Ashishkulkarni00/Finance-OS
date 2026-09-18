package com.finance.common.exception;

/**
 * The request was well-formed but is not allowed by a business rule.
 *
 * <p>Distinct from validation: validation asks "is this well-formed?" and answers
 * with 400. This asks "is this permitted, given the current state?" and answers
 * with 422.
 */
public class BusinessRuleException extends FinanceException {

    public BusinessRuleException(ErrorCode code, String message) {
        super(code, message);
    }

    public BusinessRuleException(ErrorCode code, String message, String field) {
        super(code, message, field, null);
    }

    public BusinessRuleException(ErrorCode code, String message, String field, String fix) {
        super(code, message, field, fix);
    }
}
