package com.finance.card.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A statement worked out from the card's own entries, for "Record statement" to pre-fill.
 * Saves nothing - the bank's typed figures stay authoritative.
 *
 * @param totalFromLedger what the card owed at the end of the statement date, from its
 *                        entries; null when the card was only tracked from a later date
 * @param alreadyRecorded a statement for this date is already on record
 */
public record StatementDraftResponse(
        LocalDate statementDate,
        LocalDate dueDate,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalFromLedger,

        boolean alreadyRecorded
) {
}
