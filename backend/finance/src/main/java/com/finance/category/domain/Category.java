package com.finance.category.domain;

import com.finance.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A label the user puts on spending, for grouping and comparison.
 *
 * <p>Unlike {@code AccountType}, a category carries no compiled behaviour - it is data
 * the user owns, not a rule the calculations depend on. See ADR-0008.
 *
 * <p>Every user gets their own rows; there is no shared/global category. System-seeded
 * categories are simply rows created for the user at setup (see the {@code systemDefined}
 * flag) and are otherwise editable like any other.
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_group", nullable = false, length = 20)
    private CategoryGroup group;

    /**
     * The category this one sits under, or {@code null} for a top-level category.
     *
     * <p>An id rather than a {@code @ManyToOne} to itself, for the same reason
     * {@code Transaction} holds {@code categoryId}: a mapped association would load the
     * whole chain on every read and lets calling code walk relationships the ownership
     * seam is supposed to gate. Resolution goes through {@code CategoryService}, which
     * filters by user.
     *
     * <p>Exactly one level deep, and a child always carries its parent's
     * {@code group} - both enforced in {@code CategoryServiceImpl}, see V12.
     */
    @Column(name = "parent_id")
    private Long parentId;

    public boolean isSubCategory() {
        return parentId != null;
    }

    /** Provenance only - seeded at setup rather than user-created. Not a lock. */
    @Column(name = "system_defined", nullable = false)
    @Builder.Default
    private boolean systemDefined = false;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "archived_at")
    private Instant archivedAt;

    public boolean isArchived() {
        return archivedAt != null;
    }

    public void archive() {
        this.archivedAt = Instant.now();
    }

    public void unarchive() {
        this.archivedAt = null;
    }
}
