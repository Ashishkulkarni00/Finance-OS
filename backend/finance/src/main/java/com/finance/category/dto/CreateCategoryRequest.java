package com.finance.category.dto;

import com.finance.category.domain.CategoryGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Structural validation only - "is this well-formed?". */
public record CreateCategoryRequest(

        @NotBlank(message = "Give the category a name")
        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @NotNull(message = "Choose how this category groups spending")
        CategoryGroup group,

        /**
         * Optional parent, to create this as a sub-category (V12). When given, the
         * supplied {@code group} is ignored and the parent's own group is used - a child
         * that grouped differently from its parent would be counted in one section of
         * Month while its parent sat in another.
         */
        Long parentId,

        Integer displayOrder
) {
}
