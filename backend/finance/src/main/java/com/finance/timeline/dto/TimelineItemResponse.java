package com.finance.timeline.dto;

import com.finance.timeline.TimelineItemType;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TimelineItemResponse(
        TimelineItemType type,
        Long sourceId,
        String name,
        LocalDate dueDate,

        /** Null when the amount isn't yet known (a VARIABLE commitment not yet confirmed). */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,

        String accountName,
        Long accountId
) {
}
