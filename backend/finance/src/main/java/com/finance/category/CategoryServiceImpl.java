package com.finance.category;

import com.finance.category.domain.Category;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.category.dto.UpdateCategoryRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.DuplicateResourceException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Business rules for categories. */
@Service
public class CategoryServiceImpl implements CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryServiceImpl.class);

    private final CategoryRepository repository;
    private final CategoryMapper mapper;
    private final CurrentUserProvider currentUser;

    public CategoryServiceImpl(CategoryRepository repository,
                               CategoryMapper mapper,
                               CurrentUserProvider currentUser) {
        this.repository = repository;
        this.mapper = mapper;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional
    public Category create(CreateCategoryRequest request) {
        Long userId = currentUser.currentUserId();
        String name = request.name().trim();

        if (repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, name)) {
            throw new DuplicateResourceException(ErrorCode.CATEGORY_NAME_TAKEN,
                    "You already have a category called \"" + name + "\". Pick a different name.",
                    "name");
        }

        Category category = mapper.toEntity(request, userId);
        if (request.parentId() != null) {
            adopt(category, requireEligibleParent(request.parentId(), null));
        }

        Category saved = repository.save(category);
        log.info("Category created id={} parentId={}", saved.getId(), saved.getParentId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Category getById(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(this::notFound);
    }

    @Override
    @Transactional(readOnly = true)
    public Category getByIdIncludingDeleted(Long id) {
        return repository.findByIdAndUserId(id, currentUser.currentUserId())
                .orElseThrow(this::notFound);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Category> list(boolean includeArchived, Pageable pageable) {
        return repository.findAllForUser(currentUser.currentUserId(), includeArchived, pageable);
    }

    @Override
    @Transactional
    public Category update(Long id, UpdateCategoryRequest request) {
        Category category = getById(id);

        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "A category needs a name you'll recognise.", "name");
            }
            if (repository.existsByNameForOtherCategory(category.getUserId(), name, category.getId())) {
                throw new DuplicateResourceException(ErrorCode.CATEGORY_NAME_TAKEN,
                        "You already have a category called \"" + name + "\". Pick a different name.",
                        "name");
            }
            category.setName(name);
        }

        // Parent first: adopting one also sets the group, so a request carrying both
        // would otherwise depend on field order to decide which group wins.
        if (Boolean.TRUE.equals(request.makeTopLevel())) {
            category.setParentId(null);
        } else if (request.parentId() != null) {
            adopt(category, requireEligibleParent(request.parentId(), category.getId()));
        }

        if (request.group() != null && !category.isSubCategory()) {
            category.setGroup(request.group());
        }
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }

        log.info("Category updated id={}", category.getId());
        return repository.save(category);
    }

    /**
     * Puts {@code child} under {@code parent}, taking the parent's group with it.
     *
     * <p>The group is not a free choice on a sub-category: {@code CategoryGroup} is what
     * Month's flexible-spending section and {@code TransactionType}'s income/expense
     * direction check are computed from, so "Fuel" grouped FIXED under a FLEXIBLE
     * "Transport" would have its spend counted in one place and its parent shown in
     * another. Taking the parent's group makes that impossible rather than merely
     * unlikely. See V12.
     */
    private void adopt(Category child, Category parent) {
        child.setParentId(parent.getId());
        child.setGroup(parent.getGroup());
    }

    /**
     * Resolves a proposed parent and refuses the three ways nesting can go wrong.
     *
     * <p>{@code selfId} is the category being moved, or null when creating a new one -
     * it's what makes "a category can't be its own parent" checkable.
     */
    private Category requireEligibleParent(Long parentId, Long selfId) {
        if (selfId != null && parentId.equals(selfId)) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_PARENT_IS_SELF,
                    "A category can't sit under itself.", "parentId");
        }

        Category parent = getById(parentId);

        if (parent.isSubCategory()) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_NESTING_TOO_DEEP,
                    "\"" + parent.getName() + "\" is already a sub-category. Sub-categories go one "
                            + "level deep, so pick a top-level category instead.",
                    "parentId");
        }
        if (parent.isArchived()) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_ARCHIVED,
                    "\"" + parent.getName() + "\" is archived, so nothing new can go under it.",
                    "parentId");
        }
        if (selfId != null && repository.hasChildren(parent.getUserId(), selfId)) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_NESTING_TOO_DEEP,
                    "This category has sub-categories of its own, so it can't be moved under "
                            + "another one. Move or remove those first.",
                    "parentId");
        }

        return parent;
    }

    /**
     * Archiving a parent archives its sub-categories with it.
     *
     * <p>The alternative - refusing the archive until the children are dealt with one by
     * one - makes the user do bookkeeping to express a decision they have already made:
     * retiring "Transport" means "Fuel" and "Cab" are retired too. A sub-category whose
     * parent is gone from every picker has nowhere to be offered anyway, so leaving them
     * live would say one thing in the data and another on screen.
     *
     * <p>Unarchiving does <em>not</em> cascade back, for the inverse reason: which
     * children to bring back is a real choice, and guessing "all of them" would silently
     * resurrect ones the user had retired on purpose beforehand.
     */
    @Override
    @Transactional
    public Category archive(Long id) {
        Category category = getById(id);
        if (!category.isArchived()) {
            category.archive();
            repository.save(category);

            for (Category child : repository.findChildren(category.getUserId(), id)) {
                if (!child.isArchived()) {
                    child.archive();
                    repository.save(child);
                }
            }
            log.info("Category archived id={}", id);
        }
        return category;
    }

    @Override
    @Transactional
    public Category unarchive(Long id) {
        Category category = getById(id);
        if (category.isArchived()) {
            category.unarchive();
            repository.save(category);
            log.info("Category unarchived id={}", id);
        }
        return category;
    }

    /** Soft delete. History referencing this category must remain readable. See ADR-0004. */
    @Override
    @Transactional
    public void delete(Long id) {
        Category category = getById(id);

        // Refused rather than cascaded: a soft-deleted parent with live children would
        // leave those children pointing at a row nothing can reach, which is the orphan
        // ADR-0004 exists to prevent. Archive cascades; delete does not.
        if (repository.hasChildren(category.getUserId(), id)) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_HAS_CHILDREN,
                    "\"" + category.getName() + "\" still has sub-categories under it. Delete or "
                            + "move those first, or archive this one instead.");
        }

        category.markDeleted();
        repository.save(category);
        log.info("Category soft-deleted id={}", id);
    }

    private ResourceNotFoundException notFound() {
        return new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND,
                "We couldn't find that category. It may have been deleted.");
    }
}
