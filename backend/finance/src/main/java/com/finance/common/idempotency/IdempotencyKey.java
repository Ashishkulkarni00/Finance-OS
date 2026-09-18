package com.finance.common.idempotency;

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

import java.time.Instant;

/**
 * Record of one {@code Idempotency-Key} a client has already used successfully.
 *
 * <p>A double-tapped Save sends the same key twice. The second request is recognised
 * here and replayed instead of creating a second transaction. See
 * {@code BACKEND_CONVENTIONS.md} §12 and ADR-0014.
 */
@Entity
@Table(name = "idempotency_keys")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "idempotency_key", nullable = false, updatable = false, length = 200)
    private String idempotencyKey;

    /** SHA-256 of the request body, so a reused key with a different body is rejected. */
    @Column(name = "request_hash", nullable = false, updatable = false, length = 64)
    private String requestHash;

    @Column(name = "transaction_id", nullable = false, updatable = false)
    private Long transactionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
