package com.finance.commitment.domain;

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
 * One entry that paid part (or all) of one bill - V23, USAGE_ISSUES U2.
 *
 * <p>{@code CommitmentInstance.linkedTransactionId} is a single column and is overwritten on
 * every settle, so a bill part-paid twice forgot its first payment. The arithmetic stayed
 * right ({@code confirmedAmount} accumulates) but the evidence did not: the forgotten entry
 * read as unlinked, was offered again, and could be counted a second time.
 *
 * <p><strong>Deliberately not an {@code AuditableEntity}.</strong> This is a record of what
 * happened, append-only in practice, and it must survive the soft-deletion of anything around
 * it - the same reasoning as {@code PlanRevision}. A payment that was made was made.
 *
 * <p>The database's unique key on (instance, transaction) is the real guarantee. Three layers
 * of code were asked to remember "a transaction cannot pay the same bill twice" and the one
 * value they all compared against was the one this bug destroyed.
 */
@Entity
@Table(name = "commitment_instance_payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommitmentInstancePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "commitment_instance_id", nullable = false, updatable = false)
    private Long commitmentInstanceId;

    @Column(name = "transaction_id", nullable = false, updatable = false)
    private Long transactionId;

    /**
     * What this entry contributed, captured when it was settled.
     *
     * <p>Not read back from the transaction: editing an entry's amount later must not
     * silently restate a bill that was already settled against it.
     */
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private Instant recordedAt;
}
