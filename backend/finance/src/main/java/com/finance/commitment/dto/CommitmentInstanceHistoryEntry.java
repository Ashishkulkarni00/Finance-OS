package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentInstanceStatus;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One past occurrence of the same commitment - "paid ₹2,500 last cycle too". */
public record CommitmentInstanceHistoryEntry(
        Long instanceId,
        Long cycleId,
        LocalDate dueDate,
        CommitmentInstanceStatus status,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal confirmedAmount
) {
}
