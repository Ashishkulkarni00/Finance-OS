package com.finance.forecast;

import com.finance.forecast.dto.ForecastResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/forecast")
public class ForecastController {

    private final ForecastService service;
    private final ForecastMapper mapper;

    public ForecastController(ForecastService service, ForecastMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    /** The plan projected forward, one salary month at a time. Index 0 is the current month. */
    @GetMapping
    public ForecastResponse forecast(@RequestParam(defaultValue = "12") int months) {
        return mapper.toResponse(service.forecast(months));
    }
}
