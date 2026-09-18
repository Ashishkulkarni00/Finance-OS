package com.finance.category.dto;

import com.finance.category.domain.CategoryGroup;
import jakarta.validation.constraints.Size;

/** Partial update. Every field is optional; {@code null} means "leave unchanged". */
public record UpdateCategoryRequest(

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        CategoryGroup group,

        /**
         * Move this category under another one (V12). Ignored when {@code makeTopLevel}
         * is true. Setting a parent also adopts the parent's group, for the reason given
         * on {@code CreateCategoryRequest}.
         */
        Long parentId,

        /**
         * Promote a sub-category back out to top level. A separate flag rather than
         * {@code parentId: null} because null already means "leave unchanged" for every
         * other field on this record, and one field cannot mean both.
         */
        Boolean makeTopLevel,

        Integer displayOrder
) {
}
