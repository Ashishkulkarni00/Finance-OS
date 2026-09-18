package com.finance.category;

import com.finance.category.domain.Category;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.category.dto.UpdateCategoryRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Category use cases.
 *
 * <p>An interface so other features (transactions) depend on behaviour rather than
 * implementation, and never reach into {@code CategoryRepository} directly.
 */
public interface CategoryService {

    Category create(CreateCategoryRequest request);

    Category getById(Long id);

    /** Resolves a category by id even if archived or soft-deleted, for a historical reference. */
    Category getByIdIncludingDeleted(Long id);

    Page<Category> list(boolean includeArchived, Pageable pageable);

    Category update(Long id, UpdateCategoryRequest request);

    Category archive(Long id);

    Category unarchive(Long id);

    void delete(Long id);
}
