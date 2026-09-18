package com.finance.transaction.dto;

import com.finance.transaction.domain.TransactionType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Partial update. Every field is optional; {@code null} means "leave unchanged".
 *
 * <p>Unlike an account's type, a transaction's type <em>can</em> change - editing it
 * only regenerates this transaction's own postings, it does not ripple through
 * historical figures the way changing an account's type would.
 */
public record UpdateTransactionRequest(

        LocalDate date,

        @Size(max = 200, message = "Description can be at most 200 characters")
        String description,

        TransactionType type,

        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal amount,

        Long accountId,

        Long toAccountId,

        Long categoryId,

        @Size(max = 100, message = "Merchant can be at most 100 characters")
        String merchant,

        @Size(max = 500, message = "Note can be at most 500 characters")
        String note
) {
}
