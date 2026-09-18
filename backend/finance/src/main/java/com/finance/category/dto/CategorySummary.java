package com.finance.category.dto;

import com.finance.category.domain.CategoryGroup;

/** A nested reference to a category - never the full entity, never the full response. */
public record CategorySummary(Long id, String name, CategoryGroup group) {
}
