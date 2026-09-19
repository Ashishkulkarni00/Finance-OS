package com.finance.importing;

import com.finance.importing.dto.CommitImportRequest;

import java.io.InputStream;

/**
 * CSV upload, staged review, duplicate detection before commit. See {@code ImportBatch}.
 *
 * <p>{@code upload} takes a plain filename + stream, not a {@code MultipartFile} -
 * that is a web-layer type, and the controller unwraps it before calling here, per
 * the "service must never know about HTTP" rule.
 */
public interface ImportService {

    ImportView upload(String originalFilename, InputStream content);

    /** A bank or card statement CSV, for one account - see {@code BankStatementParser}. */
    ImportView uploadStatement(String originalFilename, InputStream content, Long accountId);

    /** Fix one staged row before commit. */
    ImportView updateRow(Long batchId, Long rowId, com.finance.importing.dto.UpdateImportRowRequest request);

    ImportView getById(Long id);

    ImportView commit(Long id, CommitImportRequest request);
}
