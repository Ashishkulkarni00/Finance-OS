package com.finance.common.idempotency;

import com.finance.common.exception.IdempotencyConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A double-tapped Save must replay, not duplicate; a reused key with a different body
 * must be rejected, not silently accepted. See ADR-0014.
 */
class IdempotencyServiceTest {

    private static final Long USER_ID = 1L;

    private IdempotencyKeyRepository repository;
    private IdempotencyService service;

    @BeforeEach
    void setUp() {
        repository = mock(IdempotencyKeyRepository.class);
        service = new IdempotencyService(repository);
    }

    @Test
    @DisplayName("no key means no replay - proceed with a normal create")
    void noKeyMeansNoReplay() {
        assertThat(service.findExistingTransaction(USER_ID, null, "body")).isEmpty();
        assertThat(service.findExistingTransaction(USER_ID, "", "body")).isEmpty();
    }

    @Test
    @DisplayName("an unseen key means no replay yet")
    void unseenKeyMeansNoReplay() {
        when(repository.findByUserIdAndIdempotencyKey(USER_ID, "key-1")).thenReturn(Optional.empty());

        assertThat(service.findExistingTransaction(USER_ID, "key-1", "body")).isEmpty();
    }

    @Test
    @DisplayName("a repeated key with the same body replays the original transaction id")
    void sameKeySameBodyReplays() {
        IdempotencyKey stored = IdempotencyKey.builder()
                .userId(USER_ID).idempotencyKey("key-1").requestHash(sha256("body")).transactionId(42L)
                .createdAt(Instant.now()).build();
        when(repository.findByUserIdAndIdempotencyKey(USER_ID, "key-1")).thenReturn(Optional.of(stored));

        Optional<Long> result = service.findExistingTransaction(USER_ID, "key-1", "body");

        assertThat(result).contains(42L);
    }

    @Test
    @DisplayName("a repeated key with a different body is a conflict, not a replay")
    void sameKeyDifferentBodyConflicts() {
        IdempotencyKey stored = IdempotencyKey.builder()
                .userId(USER_ID).idempotencyKey("key-1").requestHash(sha256("original body")).transactionId(42L)
                .createdAt(Instant.now()).build();
        when(repository.findByUserIdAndIdempotencyKey(USER_ID, "key-1")).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> service.findExistingTransaction(USER_ID, "key-1", "different body"))
                .isInstanceOf(IdempotencyConflictException.class);
    }

    @Test
    @DisplayName("recording with no key is a no-op")
    void recordingWithNoKeyIsNoOp() {
        service.record(USER_ID, null, "body", 42L);
        service.record(USER_ID, "", "body", 42L);

        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("recording persists the hash, not the raw body")
    void recordingPersistsHash() {
        service.record(USER_ID, "key-1", "body", 42L);

        verify(repository).save(argThat(saved ->
                saved.getIdempotencyKey().equals("key-1")
                        && saved.getTransactionId().equals(42L)
                        && saved.getRequestHash().equals(sha256("body"))));
    }

    private static String sha256(String value) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(bytes);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
