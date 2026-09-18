package com.finance.timeline;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One dated obligation, from whichever source generated it. */
public record TimelineItem(TimelineItemType type, Long sourceId, String name, LocalDate dueDate,
                           BigDecimal amount, String accountName, Long accountId) {
}
