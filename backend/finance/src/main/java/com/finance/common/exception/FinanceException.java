package com.finance.common.exception;

/**
 * Base class for every error this application raises deliberately.
 *
 * <p>Two audiences are separated on purpose:
 * <ul>
 *   <li>{@code message} is shown to the user <em>verbatim</em>, so it is written in
 *       the product's voice - plain, calm, and never blaming.</li>
 *   <li>Diagnostic detail goes to the logs, never into the response.</li>
 * </ul>
 */
public abstract class FinanceException extends RuntimeException {

    private final ErrorCode code;
    private final String field;
    private final String fix;

    protected FinanceException(ErrorCode code, String message, String field, String fix) {
        super(message);
        this.code = code;
        this.field = field;
        this.fix = fix;
    }

    protected FinanceException(ErrorCode code, String message) {
        this(code, message, null, null);
    }

    public ErrorCode getCode() {
        return code;
    }

    /** Request field this error belongs to, if any. Lets the UI place it under the right input. */
    public String getField() {
        return field;
    }

    /** A route the user can follow to resolve this, if one exists. */
    public String getFix() {
        return fix;
    }
}
