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
    private final BankStatementParser statementParser;
    private final com.finance.account.AccountService accountService;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final CurrentUserProvider currentUser;

    public ImportServiceImpl(ImportBatchRepository batchRepository,
                             ImportRowRepository rowRepository,
                             ImportCsvParser parser,
                             BankStatementParser statementParser,
                             com.finance.account.AccountService accountService,
                             TransactionRepository transactionRepository,
                             TransactionService transactionService,
                             CurrentUserProvider currentUser) {
        this.batchRepository = batchRepository;
        this.rowRepository = rowRepository;
        this.parser = parser;
        this.statementParser = statementParser;
        this.accountService = accountService;
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional
    public ImportView upload(String originalFilename, InputStream content) {
        return stage(originalFilename, parser.parse(content));
    }

    @Override
    @Transactional
    public ImportView uploadStatement(String originalFilename, InputStream content, Long accountId) {
        // Ownership-checked: another user's account is a 404.
        com.finance.account.domain.Account account = accountService.getById(accountId);
        boolean card = account.getType() == com.finance.account.domain.AccountType.CREDIT_CARD;
        List<ImportRow> rows = statementParser.parse(content, accountId, card);
        Long userId = currentUser.currentUserId();
        for (ImportRow row : rows) {
            // Category from the user's own last entry with the same description - a pre-fill
            // shown in the review, never imported without the user seeing it.
            if (row.isValid() && row.getType() != null && row.getType().requiresCategory()) {
                transactionRepository
                        .findFirstByUserIdAndTypeAndDescriptionIgnoreCaseAndDeletedAtIsNullOrderByDateDescIdDesc(
                                userId, row.getType(), row.getDescription())
                        .ifPresent(previous -> row.setCategoryId(previous.getCategoryId()));
            }
        }
        return stage(originalFilename, rows);
    }

    @Override
    @Transactional
    public ImportView updateRow(Long batchId, Long rowId, com.finance.importing.dto.UpdateImportRowRequest request) {
        ImportBatch batch = requireOwned(batchId);
        if (batch.isCommitted()) {
            throw new BusinessRuleException(ErrorCode.IMPORT_ALREADY_COMMITTED, "This import has already been committed.");
        }
        ImportRow row = rowsFor(batch).stream().filter(r -> r.getId().equals(rowId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.IMPORT_NOT_FOUND, "We couldn't find that row."));
        if (!row.isValid()) {
            throw new BusinessRuleException(ErrorCode.IMPORT_ROW_INVALID, "This line couldn't be read, so it can't be imported.");
        }
        if (request.type() != null) {
            row.setType(request.type());
            if (!request.type().requiresCategory()) {
                row.setCategoryId(null);
            }
            if (!request.type().requiresDestination()) {
                row.setToAccountId(null);
            }
        }
        if (Boolean.TRUE.equals(request.clearCategory())) {
            row.setCategoryId(null);
        } else if (request.categoryId() != null) {
            row.setCategoryId(request.categoryId());
        }
        if (request.toAccountId() != null) {
            accountService.getById(request.toAccountId());
            row.setToAccountId(request.toAccountId());
        }
        if (request.description() != null && !request.description().isBlank()) {
            row.setDescription(request.description().trim());
        }
        rowRepository.save(row);
        log.info("Import row updated batchId={} rowId={}", batchId, rowId);
        return new ImportView(batch, rowsFor(batch));
    }

    private ImportView stage(String originalFilename, List<ImportRow> parsedRows) {
        Long userId = currentUser.currentUserId();

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
        Set<Long> excluded = request.excludeRowIds() == null ? Set.of() : new HashSet<>(request.excludeRowIds());

        List<ImportRow> rows = rowsFor(batch);
        List<ImportRow> toImport = rows.stream()
                .filter(ImportRow::isValid)
                .filter(r -> !excluded.contains(r.getId()))
                .filter(r -> !r.isDuplicate() || includeDuplicates.contains(r.getId()))
                .toList();
        // Say what's missing before anything is created - the commit is all or nothing.
        long needCategory = toImport.stream()
                .filter(r -> r.getType() != null && r.getType().requiresCategory() && r.getCategoryId() == null).count();
        long needDestination = toImport.stream()
                .filter(r -> r.getType() != null && r.getType().requiresDestination() && r.getToAccountId() == null).count();
        if (needCategory > 0 || needDestination > 0) {
            throw new BusinessRuleException(ErrorCode.IMPORT_ROW_INVALID,
                    (needCategory > 0 ? needCategory + (needCategory == 1 ? " entry needs" : " entries need") + " a category" : "")
                            + (needCategory > 0 && needDestination > 0 ? ", and " : "")
                            + (needDestination > 0 ? needDestination + (needDestination == 1 ? " transfer needs" : " transfers need")
                                    + " the account it went to" : "")
                            + ". Fill them in, or leave those rows out.", "rows");
        }
        for (ImportRow row : toImport) {

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
