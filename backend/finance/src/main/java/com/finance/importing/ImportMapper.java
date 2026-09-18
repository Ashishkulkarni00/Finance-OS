package com.finance.importing;

import com.finance.importing.domain.ImportRow;
import com.finance.importing.dto.ImportBatchResponse;
import com.finance.importing.dto.ImportRowResponse;
import org.springframework.stereotype.Component;

@Component
public class ImportMapper {

    public ImportBatchResponse toResponse(ImportView view) {
        var batch = view.batch();
        return new ImportBatchResponse(
                batch.getId(), batch.getOriginalFilename(), batch.getStatus(),
                batch.getTotalRows(), batch.getDuplicateRows(), batch.getInvalidRows(),
                batch.getUploadedAt(), batch.getCommittedAt(),
                view.rows().stream().map(this::toResponse).toList());
    }

    private ImportRowResponse toResponse(ImportRow row) {
        return new ImportRowResponse(
                row.getId(), row.getRowNumber(), row.getDate(), row.getDescription(), row.getType(),
                row.getAmount(), row.getAccountId(), row.getToAccountId(), row.getCategoryId(),
                row.getMerchant(), row.getNote(), row.getParseError(), row.isDuplicate(),
                row.getDuplicateOfTransactionId(), row.getCommittedTransactionId());
    }
}
