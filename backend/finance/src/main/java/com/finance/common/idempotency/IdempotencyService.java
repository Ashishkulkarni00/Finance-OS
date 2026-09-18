package com.finance.common.idempotency;

import com.finance.common.exception.IdempotencyConflictException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Turns an {@code Idempotency-Key} header into "create it" or "here's what you made
 * last time" - never a second row for the same intent.
 *
 * <p>Kept generic ({@code requestFingerprint} is caller-supplied) so any write
 * endpoint can adopt it without a new table. Milestone 2 wires it into
 * {@code TransactionServiceImpl.create} only. See ADR-0014.
 */
@Component
public class IdempotencyService {

    private final IdempotencyKeyRepository repository;

    public IdempotencyService(IdempotencyKeyRepository repository) {
        this.repository = repository;
    }

    /**
     * Looks up a prior use of this key for this user.
     *
     * @throws IdempotencyConflictException if the key was already used with a
     *         different request body
     */
    public Optional<Long> findExistingTransaction(Long userId, String idempotencyKey, String requestFingerprint) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String hash = hash(requestFingerprint);
        return repository.findByUserIdAndIdempotencyKey(userId, idempotencyKey)
                .map(existing -> {
                    if (!existing.getRequestHash().equals(hash)) {
                        throw new IdempotencyConflictException(
                                "This idempotency key was already used for a different request.");
                    }
                    return existing.getTransactionId();
                });
    }

    /** Records that {@code idempotencyKey} produced {@code transactionId}, for future replay. */
    public void record(Long userId, String idempotencyKey, String requestFingerprint, Long transactionId) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }
        repository.save(IdempotencyKey.builder()
                .userId(userId)
                .idempotencyKey(idempotencyKey)
                .requestHash(hash(requestFingerprint))
                .transactionId(transactionId)
                .createdAt(Instant.now())
                .build());
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
