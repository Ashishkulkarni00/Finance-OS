package com.finance.commitment.dto;

import com.finance.commitment.domain.SkipReason;
import jakarta.validation.constraints.Size;

/**
 * Body of {@code POST /commitment-instances/{id}/skip}. Optional as a whole - an optional
 * commitment can still be skipped with no body, as before - but a must-pay commitment needs a
 * {@code reason} (enforced in the service, where "must-pay" is known).
 */
public record SkipCommitmentInstanceRequest(
        SkipReason reason,

        @Size(max = 200, message = "Keep the note under 200 characters")
        String note
) {
}
