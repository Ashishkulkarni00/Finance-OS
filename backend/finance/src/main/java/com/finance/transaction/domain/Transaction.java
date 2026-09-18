package com.finance.transaction.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A single ledger entry: one thing that happened to money, on one day.
 *
 * <p>References to other entities ({@code accountId}, {@code toAccountId},
 * {@code categoryId}) are plain foreign-key columns, not JPA associations - the same
 * style {@code Account} uses for {@code userId}. The service layer fetches and
 * validates them explicitly; nothing here is lazily traversed.
 *
 * <p>{@code amount} is always positive - direction lives entirely in the postings
 * this transaction produces, never in the sign of this field. See ADR-0001 and
 * {@code BACKEND_CONVENTIONS.md} §4.
 */
@Entity
@Table(name = "transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /** The account this transaction is entered against. Source account for a transfer. */
    @Column(name = "account_id", nullable = false)
    private Long accountId;

    /** Destination account. Required for TRANSFER/INVESTMENT, null otherwise. */
    @Column(name = "to_account_id")
    private Long toAccountId;

    /** Required for INCOME/EXPENSE/REFUND, null for TRANSFER/INVESTMENT. */
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "merchant", length = 100)
    private String merchant;

    @Column(name = "note", length = 500)
    private String note;
}
