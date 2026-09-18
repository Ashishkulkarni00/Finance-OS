package com.finance.transaction.domain;

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

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One signed movement against one account, generated from a {@link Transaction}.
 *
 * <p>The double-entry underneath the product: every transaction produces postings
 * that sum to zero (see {@code PostingFactory}), which is what makes the same rupee
 * being counted twice structurally impossible rather than merely discouraged. The
 * user never sees this entity or the term "posting".
 *
 * <p>Postings are a pure derivation of their transaction's fields, not an
 * independently entered record - they carry no version or soft-delete of their own.
 * Editing a transaction deletes and regenerates its postings inside the same
 * transaction boundary; the {@code Transaction} row is the audit trail. A posting is
 * excluded from balance calculations by joining to its (non-deleted) transaction,
 * not by a delete flag of its own.
 *
 * <p>{@code userId} is denormalised from the transaction so every query here still
 * filters on it directly, per the ownership rule - this is query-shape duplication,
 * not a stored derived money value (that rule is about balances, Real Balance, etc.,
 * never about which user a row belongs to). See ADR-0011.
 */
@Entity
@Table(name = "postings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Posting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, updatable = false)
    private Long transactionId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    /** Signed. Positive increases the account, negative decreases it. */
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
