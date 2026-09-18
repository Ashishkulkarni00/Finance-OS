package com.finance.card;

import java.math.BigDecimal;
import java.time.LocalDate;

/** See {@code StatementDraftResponse}. */
public record StatementDraft(LocalDate statementDate, LocalDate dueDate, BigDecimal totalFromLedger,
                             boolean alreadyRecorded) {
}
