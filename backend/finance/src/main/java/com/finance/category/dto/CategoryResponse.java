package com.finance.category.dto;

import com.finance.category.domain.CategoryGroup;

import java.time.Instant;

/** What the API exposes for a category. The entity itself is never serialised. */
public record CategoryResponse(
        Long id,
        String name,
        CategoryGroup group,
        boolean systemDefined,
        int displayOrder,
        boolean archived,
        Instant archivedAt,
        /**
         * The category this one sits under, or null if it is top-level (V12).
         *
         * <p>Just the id, not a resolved parent name: every caller already holds the full
         * category list from {@code GET /categories} and can name the parent from it,
         * whereas resolving it here would be one extra lookup per row on the list
         * endpoint for a string the client already has.
         */
        Long parentId,
        Instant createdAt,
        Instant updatedAt
) {
}
