package com.finance.importing.dto;

import java.util.List;

/**
 * Rows flagged as possible duplicates are skipped on commit unless their id is
 * explicitly listed here - the user has looked and confirmed they are not duplicates
 * after all. An empty or null list skips every duplicate.
 */
public record CommitImportRequest(List<Long> includeDuplicateRowIds) {
}
