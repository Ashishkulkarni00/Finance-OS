package com.finance.common.exception;

/**
 * The same {@code Idempotency-Key} was reused with a different request body.
 *
 * <p>A repeated key with an identical request is a safe retry and is replayed. A
 * repeated key with a different body means the client reused a key it should not
 * have - that is a client error, not a safe no-op.
 */
public class IdempotencyConflictException extends FinanceException {

    public IdempotencyConflictException(String message) {
        super(ErrorCode.IDEMPOTENCY_CONFLICT, message, "Idempotency-Key", null);
    }
}
