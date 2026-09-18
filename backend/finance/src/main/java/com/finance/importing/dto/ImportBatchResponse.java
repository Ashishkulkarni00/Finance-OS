package com.finance.importing.dto;

import com.finance.importing.domain.ImportStatus;

import java.time.Instant;
import java.util.List;

public record ImportBatchResponse(
        Long id,
        String originalFilename,
        ImportStatus status,
        int totalRows,
        int duplicateRows,
        int invalidRows,
        Instant uploadedAt,
        Instant committedAt,
        List<ImportRowResponse> rows
) {
}
