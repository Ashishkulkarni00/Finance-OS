package com.finance.projection;

import com.finance.projection.dto.ProjectionResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The shortfall detector. See {@code ProjectionService}. */
@RestController
@RequestMapping("/api/v1/accounts")
public class ProjectionController {

    private final ProjectionService service;
    private final ProjectionMapper mapper;

    public ProjectionController(ProjectionService service, ProjectionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/{id}/projection")
    public ProjectionResponse projection(@PathVariable Long id) {
        return mapper.toResponse(service.projectAccount(id));
    }
}
