package com.finance.projection;

/** The shortfall detector - "₹6,882 short in IDBI before the 13th". See DOMAIN_MODEL.md's A6. */
public interface ProjectionService {

    /** Projects one account's balance to the end of the current cycle - the next pay date. */
    ProjectionResult projectAccount(Long accountId);
}
