package com.finance.timeline;

import com.finance.timeline.dto.TimelineItemResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/timeline")
public class TimelineController {

    private final TimelineService service;
    private final TimelineMapper mapper;

    public TimelineController(TimelineService service, TimelineMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<TimelineItemResponse> upcoming(@RequestParam(defaultValue = "30") int days) {
        return service.upcoming(days).stream().map(mapper::toResponse).toList();
    }
}
