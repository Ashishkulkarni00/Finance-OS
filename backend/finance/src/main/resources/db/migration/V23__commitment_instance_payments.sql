-- USAGE_ISSUES U2 - a bill remembers every payment, not just the last one.
--
-- `commitment_instances.linked_transaction_id` is a single column, overwritten on each
-- settle. `confirmed_amount` accumulated correctly, so the arithmetic was always right, but
-- the evidence was not: after settling with A then B, A was forgotten. It then read as an
-- unlinked entry, was offered again in the Settle picker, and taking it would have added its
-- amount a second time. That happened on real data within hours of being written up - the
-- emergency-fund top-up holds ₹10,500 of which only ₹500 is still named.
--
-- The unique key is the actual fix. "A transaction cannot pay the same bill twice" becomes
-- something the database enforces rather than something three layers of code have to
-- remember - and the guard added on 2026-10-02 could only ever compare against the *current*
-- link, which is precisely the value this bug destroys.
--
-- `linked_transaction_id` is deliberately kept. It now means "the most recent payment", which
-- is what `settledOn` and `settledFromAccount` want, and leaving it alone keeps this change
-- additive: every existing read path works untouched.
--
-- **Backfill is honest about what was lost.** Each instance's current link is recorded with
-- that transaction's own amount. Where a bill was part-paid more than once before today, the
-- earlier payments are genuinely unrecoverable - the column that held them was overwritten -
-- so no row is invented for them. A bill in that state will show a payment total below its
-- confirmed amount, which is the truth about what is known.
-- ---------------------------------------------------------------------------

CREATE TABLE commitment_instance_payments (
    id                     BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id                BIGINT        NOT NULL,
    commitment_instance_id BIGINT        NOT NULL,
    transaction_id         BIGINT        NOT NULL,
    -- What this entry contributed, captured at settle time. Not read back from the
    -- transaction: a later edit to the entry must not silently restate a settled bill.
    amount                 DECIMAL(15,2) NOT NULL,
    recorded_at            TIMESTAMP     NOT NULL,

    CONSTRAINT uq_cip_instance_transaction UNIQUE (commitment_instance_id, transaction_id),
    CONSTRAINT fk_cip_instance FOREIGN KEY (commitment_instance_id)
        REFERENCES commitment_instances (id) ON DELETE CASCADE,
    CONSTRAINT fk_cip_transaction FOREIGN KEY (transaction_id)
        REFERENCES transactions (id)
);

-- "Does any bill already count this entry?" is asked on every candidate list and every
-- settle; it must not table-scan.
CREATE INDEX idx_cip_transaction ON commitment_instance_payments (transaction_id);
CREATE INDEX idx_cip_user ON commitment_instance_payments (user_id);

INSERT INTO commitment_instance_payments (user_id, commitment_instance_id, transaction_id, amount, recorded_at)
SELECT ci.user_id,
       ci.id,
       ci.linked_transaction_id,
       t.amount,
       COALESCE(ci.confirmed_at, ci.updated_at, CURRENT_TIMESTAMP)
FROM commitment_instances ci
         JOIN transactions t ON t.id = ci.linked_transaction_id
WHERE ci.linked_transaction_id IS NOT NULL
  AND t.deleted_at IS NULL;
