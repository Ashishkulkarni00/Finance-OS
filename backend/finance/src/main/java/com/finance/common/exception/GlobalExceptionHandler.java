package com.finance.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * The single place that turns an exception into an HTTP response.
 *
 * <p>Responses follow RFC 7807 ({@link ProblemDetail}) with four extensions:
 * {@code code}, {@code field}, {@code fix} and {@code timestamp}.
 *
 * <p>No controller contains a try/catch for business errors.
 *
 * <p><strong>Note on "we don't know yet":</strong> incomplete data is <em>not</em> an
 * error. An endpoint that cannot compute a figure because a required input is missing
 * returns 200 with a state and a list of blockers - nothing failed. See ADR-0006.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String PROBLEM_BASE = "https://finance.local/errors/";

    /** Every deliberate application error. */
    @ExceptionHandler(FinanceException.class)
    public ProblemDetail handleFinanceException(FinanceException ex, HttpServletRequest request) {
        log.warn("Business error [{}] on {} {}: {}",
                ex.getCode(), request.getMethod(), request.getRequestURI(), ex.getMessage());
        return problem(ex.getCode(), ex.getMessage(), ex.getField(), ex.getFix(), request);
    }

    /** Bean Validation failures on a request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex,
                                          HttpServletRequest request) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() == null ? "Invalid value" : fe.getDefaultMessage()))
                .toList();

        ProblemDetail pd = problem(ErrorCode.VALIDATION_FAILED,
                "Some details need fixing before we can save this.", null, null, request);
        pd.setProperty("errors", errors);
        return pd;
    }

    /** Unparseable JSON, or a value that cannot be coerced into the target type. */
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ProblemDetail handleMalformed(Exception ex, HttpServletRequest request) {
        log.warn("Malformed request on {} {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());
        return problem(ErrorCode.MALFORMED_REQUEST,
                "We couldn't read that request. Please check the values and try again.",
                null, null, request);
    }

    /** Two edits collided. The user should reload and retry. */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail handleConcurrentModification(OptimisticLockingFailureException ex,
                                                      HttpServletRequest request) {
        log.warn("Optimistic lock failure on {} {}", request.getMethod(), request.getRequestURI());
        return problem(ErrorCode.CONCURRENT_MODIFICATION,
                "This changed somewhere else while you were editing. Reload and try again.",
                null, null, request);
    }

    /**
     * Anything unforeseen. The client is told nothing about the cause - the stack trace
     * goes to the log only.
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return problem(ErrorCode.INTERNAL_ERROR,
                "We couldn't complete that. Your existing information is safe - please try again.",
                null, null, request);
    }

    private ProblemDetail problem(ErrorCode code, String detail, String field, String fix,
                                  HttpServletRequest request) {
        HttpStatus status = code.status();
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(titleFor(code));
        pd.setType(URI.create(PROBLEM_BASE + code.name().toLowerCase().replace('_', '-')));
        pd.setInstance(URI.create(request.getRequestURI()));
        pd.setProperty("code", code.name());
        pd.setProperty("timestamp", Instant.now().toString());
        if (field != null) {
            pd.setProperty("field", field);
        }
        if (fix != null) {
            pd.setProperty("fix", fix);
        }
        return pd;
    }

    private String titleFor(ErrorCode code) {
        String words = code.name().toLowerCase().replace('_', ' ');
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }
}
