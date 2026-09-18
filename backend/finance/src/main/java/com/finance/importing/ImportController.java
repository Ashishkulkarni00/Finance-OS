package com.finance.importing;

import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.importing.dto.CommitImportRequest;
import com.finance.importing.dto.ImportBatchResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;

/**
 * HTTP for imports. The one place a {@code MultipartFile} is touched - unwrapped into
 * a plain stream before the service ever sees it.
 */
@RestController
@RequestMapping("/api/v1/imports")
public class ImportController {

    private final ImportService service;
    private final ImportMapper mapper;

    public ImportController(ImportService service, ImportMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ImportBatchResponse> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "The uploaded file is empty.", "file");
        }
        ImportView created = service.upload(file.getOriginalFilename(), file.getInputStream());
        return ResponseEntity
                .created(URI.create("/api/v1/imports/" + created.batch().getId()))
                .body(mapper.toResponse(created));
    }

    @GetMapping("/{id}")
    public ImportBatchResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PostMapping("/{id}/commit")
    public ImportBatchResponse commit(@PathVariable Long id, @Valid @RequestBody(required = false) CommitImportRequest request) {
        return mapper.toResponse(service.commit(id, request == null ? new CommitImportRequest(null) : request));
    }
}
