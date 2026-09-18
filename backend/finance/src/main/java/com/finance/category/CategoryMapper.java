package com.finance.category;

import com.finance.category.domain.Category;
import com.finance.category.dto.CategoryResponse;
import com.finance.category.dto.CategorySummary;
import com.finance.category.dto.CreateCategoryRequest;
import org.springframework.stereotype.Component;

/** Entity to DTO, by hand - see the rationale on {@code AccountMapper}. */
@Component
public class CategoryMapper {

    public Category toEntity(CreateCategoryRequest request, Long userId) {
        return Category.builder()
                .userId(userId)
                .name(request.name().trim())
                .group(request.group())
                .systemDefined(false)
                .displayOrder(request.displayOrder() == null ? 0 : request.displayOrder())
                .build();
    }

    public CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getGroup(),
                category.isSystemDefined(),
                category.getDisplayOrder(),
                category.isArchived(),
                category.getArchivedAt(),
                category.getParentId(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    public CategorySummary toSummary(Category category) {
        if (category == null) {
            return null;
        }
        return new CategorySummary(category.getId(), category.getName(), category.getGroup());
    }
}
