-- A bill can come from something the user already told us about - a loan's EMI, a SIP,
-- a goal's monthly contribution - instead of being typed a second time. The source
-- decides the bill's amount, day, account and end; the bill keeps its own name, notes
-- and history. Existing bills are all MANUAL, which is exactly what they were.
--
-- settle_as says what kind of Ledger entry pays the bill. Until now every bill settled
-- as an EXPENSE, so a transfer to savings or a SIP instalment could never mark it paid
-- (FIX_BACKLOG 1.1). INCOME makes the rule an expected inflow - the salary.

ALTER TABLE commitments
    ADD COLUMN source_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL' AFTER if_skipped,
    ADD COLUMN source_id   BIGINT      NULL AFTER source_type,
    ADD COLUMN settle_as   VARCHAR(20) NOT NULL DEFAULT 'EXPENSE' AFTER source_id,
    ADD KEY ix_commitments_source (user_id, source_type, source_id);
