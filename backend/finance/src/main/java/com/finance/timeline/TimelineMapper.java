package com.finance.timeline;

import com.finance.timeline.dto.TimelineItemResponse;
import org.springframework.stereotype.Component;

@Component
public class TimelineMapper {

    public TimelineItemResponse toResponse(TimelineItem item) {
        return new TimelineItemResponse(item.type(), item.sourceId(), item.name(), item.dueDate(),
                item.amount(), item.accountName(), item.accountId());
    }
}
