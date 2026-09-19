package com.finance.importing.dto;

import java.util.List;

/**
 * Rows flagged as possible duplicates are skipped on commit unless their id is
 * explicitly listed in {@code includeDuplicateRowIds} - the user has looked and confirmed
 * they are not duplicates after all. An empty or null list skips every duplicate.
 * {@code excludeRowIds} leaves chosen rows out entirely (the review screen's untick).
 */
public record CommitImportRequest(List<Long> includeDuplicateRowIds, List<Long> excludeRowIds) {

    public CommitImportRequest(List<Long> includeDuplicateRowIds) {
        this(includeDuplicateRowIds, null);
    }
}
