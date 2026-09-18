package com.finance.importing;

import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import com.finance.importing.domain.ImportBatch;
import com.finance.importing.domain.ImportRow;
import com.finance.importing.domain.ImportStatus;
import com.finance.importing.dto.CommitImportRequest;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionService;
import com.finance.transaction.domain.Transaction;
import com.finance.transaction.dto.CreateTransactionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ImportServiceImpl implements ImportService {

    private static final Logger log = LoggerFactory.getLogger(ImportServiceImpl.class);

    private final ImportBatchRepository batchRepository;
    private final ImportRowRepository rowRepository;
    private final ImportCsvParser parser;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final CurrentUserProvider currentUser;

    public ImportServiceImpl(ImportBatchRepository batchRepository,
                             ImportRowRepository rowRepository,
                             ImportCsvParser parser,
                             TransactionRepository transactionRepository,
                             TransactionService transactionService,
                             CurrentUserProvider currentUser) {
        this.batchRepository = batchRepository;
        this.rowRepository = rowRepository;
        this.parser = parser;
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional
    public ImportView upload(String originalFilename, InputStream content) {
        Long userId = currentUser.currentUserId();
        List<ImportRow> parsedRows = parser.parse(content);

        int duplicateCount = 0;
        int invalidCount = 0;
        for (ImportRow row : parsedRows) {
            row.setUserId(userId);
            if (!row.isValid()) {
                invalidCount++;
                continue;
            }
            List<Transaction> possibleDuplicates = transactionRepository.findPossibleDuplicates(
                    userId, row.getAccountId(), row.getAmount(), row.getDate());
            if (!possibleDuplicates.isEmpty()) {
                row.setDuplicate(true);
                row.setDuplicateOfTransactionId(possibleDuplicates.get(0).getId());
                duplicateCount++;
            }
        }

        ImportBatch batch = ImportBatch.builder()
                .userId(userId)
                .originalFilename(originalFilename)
                .status(ImportStatus.STAGED)
                .totalRows(parsedRows.size())
                .duplicateRows(duplicateCount)
                .invalidRows(invalidCount)
                .uploadedAt(Instant.now())
                .build();
        ImportBatch savedBatch = batchRepository.save(batch);

        for (ImportRow row : parsedRows) {
            row.setImportBatchId(savedBatch.getId());
        }
        List<ImportRow> savedRows = rowRepository.saveAll(parsedRows);

        log.info("Import uploaded id={} totalRows={} duplicates={} invalid={}",
                savedBatch.getId(), parsedRows.size(), duplicateCount, invalidCount);
        return new ImportView(savedBatch, savedRows);
    }

    @Override
    @Transactional(readOnly = true)
    public ImportView getById(Long id) {
        ImportBatch batch = requireOwned(id);
        return new ImportView(batch, rowsFor(batch));
    }

    @Override
    @Transactional
    public ImportView commit(Long id, CommitImportRequest request) {
        ImportBatch batch = requireOwned(id);
        if (batch.isCommitted()) {
            throw new BusinessRuleException(ErrorCode.IMPORT_ALREADY_COMMITTED,
                    "This import has already been committed.");
        }

        Set<Long> includeDuplicates = request.includeDuplicateRowIds() == null
                ? Set.of() : new HashSet<>(request.includeDuplicateRowIds());

        List<ImportRow> rows = rowsFor(batch);
        for (ImportRow row : rows) {
            if (!row.isValid()) {
                continue;
            }
            if (row.isDuplicate() && !includeDuplicates.contains(row.getId())) {
                continue;
            }

            CreateTransactionRequest txRequest = new CreateTransactionRequest(
                    row.getDate(), row.getDescription(), row.getType(), row.getAmount(),
                    row.getAccountId(), row.getToAccountId(), row.getCategoryId(),
                    row.getMerchant(), row.getNote());

            var created = transactionService.create(txRequest, "import-" + batch.getId() + "-row-" + row.getId());
            row.setCommittedTransactionId(created.transaction().getId());
        }
        rowRepository.saveAll(rows);

        batch.setStatus(ImportStatus.COMMITTED);
        batch.setCommittedAt(Instant.now());
        ImportBatch saved = batchRepository.save(batch);

        log.info("Import committed id={} committedRows={}", saved.getId(),
                rows.stream().filter(r -> r.getCommittedTransactionId() != null).count());
        return new ImportView(saved, rows);
    }

    private List<ImportRow> rowsFor(ImportBatch batch) {
        return rowRepository.findByImportBatchIdAndUserIdOrderByRowNumberAsc(batch.getId(), batch.getUserId());
    }

    private ImportBatch requireOwned(Long id) {
        return batchRepository.findByIdAndUserId(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.IMPORT_NOT_FOUND,
                        "We couldn't find that import."));
    }
}
