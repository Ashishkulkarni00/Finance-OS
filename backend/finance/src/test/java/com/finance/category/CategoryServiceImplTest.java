package com.finance.category;

import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.category.dto.UpdateCategoryRequest;
import com.finance.common.exception.DuplicateResourceException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.FinanceException;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Business rules for categories - name collisions, ownership isolation, archiving,
 * soft deletion. Mirrors {@code AccountServiceImplTest}'s shape deliberately.
 */
class CategoryServiceImplTest {

    private static final Long USER_ID = CurrentUserProvider.DEVELOPMENT_USER_ID;

    private CategoryRepository repository;
    private CategoryServiceImpl service;

    @BeforeEach
    void setUp() {
        repository = mock(CategoryRepository.class);
        CurrentUserProvider currentUser = mock(CurrentUserProvider.class);
        when(currentUser.currentUserId()).thenReturn(USER_ID);

        service = new CategoryServiceImpl(repository, new CategoryMapper(), currentUser);
    }

    private CreateCategoryRequest validRequest() {
        return new CreateCategoryRequest("Hobbies", CategoryGroup.FLEXIBLE, null, 20);
    }

    private Category existing() {
        Category category = Category.builder()
                .id(1L).userId(USER_ID).name("Hobbies").group(CategoryGroup.FLEXIBLE)
                .systemDefined(false).displayOrder(20)
                .build();
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());
        return category;
    }

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        @DisplayName("stamps the current user as owner")
        void assignsOwner() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(anyLong(), anyString()))
                    .thenReturn(false);
            when(repository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

            Category created = service.create(validRequest());

            assertThat(created.getUserId()).isEqualTo(USER_ID);
            assertThat(created.getName()).isEqualTo("Hobbies");
            assertThat(created.isSystemDefined()).isFalse();
        }

        @Test
        @DisplayName("rejects a duplicate name for the same user")
        void rejectsDuplicateName() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(USER_ID, "Hobbies"))
                    .thenReturn(true);

            assertThatThrownBy(() -> service.create(validRequest()))
                    .isInstanceOf(DuplicateResourceException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.CATEGORY_NAME_TAKEN);

            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("read and update")
    class ReadUpdate {

        @Test
        @DisplayName("another user's category is not found")
        void enforcesOwnership() {
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(99L, USER_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.CATEGORY_NOT_FOUND);
        }

        @Test
        @DisplayName("null fields leave existing values untouched")
        void partialUpdateLeavesOtherFields() {
            Category category = existing();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(category));
            when(repository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

            UpdateCategoryRequest request = new UpdateCategoryRequest(null, CategoryGroup.EVENT, null, null, null);

            Category updated = service.update(1L, request);

            assertThat(updated.getGroup()).isEqualTo(CategoryGroup.EVENT);
            assertThat(updated.getName()).isEqualTo("Hobbies");
        }

        @Test
        @DisplayName("renaming onto another category's name is rejected")
        void rejectsRenameCollision() {
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(existing()));
            when(repository.existsByNameForOtherCategory(USER_ID, "Groceries", 1L)).thenReturn(true);

            UpdateCategoryRequest request = new UpdateCategoryRequest("Groceries", null, null, null, null);

            assertThatThrownBy(() -> service.update(1L, request))
                    .isInstanceOf(DuplicateResourceException.class);
        }
    }

    @Nested
    @DisplayName("lifecycle")
    class Lifecycle {

        @Test
        @DisplayName("archiving is reversible")
        void archiveIsReversible() {
            Category category = existing();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(category));
            when(repository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

            assertThat(service.archive(1L).isArchived()).isTrue();
            assertThat(service.unarchive(1L).isArchived()).isFalse();
        }

        @Test
        @DisplayName("delete is soft - history referencing this category stays readable")
        void deleteIsSoft() {
            Category category = existing();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(category));
            when(repository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

            service.delete(1L);

            assertThat(category.isDeleted()).isTrue();
            verify(repository, never()).delete(any());
            verify(repository, never()).deleteById(anyLong());
        }
    }
}
