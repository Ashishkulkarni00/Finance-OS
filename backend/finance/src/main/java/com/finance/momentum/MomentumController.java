package com.finance.momentum;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Which way things are moving - named directions with reasons, no score (ROADMAP 6.3). */
@RestController
@RequestMapping("/api/v1/momentum")
public class MomentumController {

    private final MomentumService service;

    public MomentumController(MomentumService service) {
        this.service = service;
    }

    @GetMapping
    public List<MomentumService.Item> current() {
        return service.current();
    }
}
