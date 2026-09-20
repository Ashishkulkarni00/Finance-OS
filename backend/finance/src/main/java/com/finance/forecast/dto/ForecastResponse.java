package com.finance.forecast.dto;

import com.finance.commitment.CommitmentBucket;
import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** {@code GET /api/v1/forecast?months=} - see {@code ForecastMonth}. Money as strings. */
public record ForecastResponse(List<Month> months) {

    public record Month(
            LocalDate cycleStart,
            LocalDate cycleEnd,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal incomeExpected,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal committed,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal setAside,
            /** Absent when nothing is planned to come in this month. */
            @JsonSerialize(using = MoneySerializer.class) BigDecimal flexible,
            int unknownAmountCount,
            List<Unlock> unlocks,
            List<AnnualItem> annualItems
    ) {
    }

    public record Unlock(Long commitmentId, String name,
                         @JsonSerialize(using = MoneySerializer.class) BigDecimal amount, CommitmentBucket bucket) {
    }

    public record AnnualItem(Long commitmentId, String name,
                             @JsonSerialize(using = MoneySerializer.class) BigDecimal amount, LocalDate dueDate) {
    }
}
