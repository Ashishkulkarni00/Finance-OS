package com.finance.card.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * The bank's own statement figures, typed in by the user - deliberately conservative,
 * inherited from the spreadsheet. Never derived, unlike outstanding/unbilled/available
 * credit, which are computed from postings. See DOMAIN_MODEL.md §2 "Cards".
 *
 * <p>Soft-deletable since V15, so a statement typed in wrong can be withdrawn and
 * re-entered. The restriction keeps withdrawn statements out of every query.
 */
@Entity
@Table(name = "card_statements")
@SQLRestriction("deleted_at is null")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardStatement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    @Column(name = "statement_date", nullable = false)
    private LocalDate statementDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "minimum_due", nullable = false, precision = 15, scale = 2)
    private BigDecimal minimumDue;

    @Column(name = "entered_at", nullable = false, updatable = false)
    private Instant enteredAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public void markDeleted() {
        this.deletedAt = Instant.now();
    }
}
