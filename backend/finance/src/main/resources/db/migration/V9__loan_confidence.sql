-- ---------------------------------------------------------------------------
-- V9 : loan confidence, status, and the paying account
--
-- The source workbook's Loans sheet opens with its own thesis:
--
--   "Nothing here is invented. Where a real figure has not been supplied the cell
--    says TBD and the Confidence column says so."
--
-- That is ADR-0006 in the user's own words, and until now the loan model could not
-- express it: annual_rate was NOT NULL, and the amortisation calculator derives an
-- outstanding principal and a payoff date from whatever numbers happen to be in the
-- row - confidently, whether or not those numbers came from a sanction letter or a
-- guess. `confidence` exists to gate those derived figures, not to decorate them.
--
-- `pay_from_account_id` closes a real gap found while building the Accounts page: a
-- loan's own account_id is the LIABILITY ("Bike Loan"), not the account the EMI
-- debits, and nothing recorded the latter. Nullable on purpose - an unrecorded
-- paying account is unknown, and unknown is not a guess.
-- ---------------------------------------------------------------------------

ALTER TABLE loans
    -- CONFIRMED (from paperwork) · ESTIMATED (derived from what was stated) · TBD.
    ADD COLUMN confidence          VARCHAR(20)  NOT NULL DEFAULT 'ESTIMATED' AFTER paid_via,

    -- ACTIVE · UNCONFIRMED (a payment we cannot verify - never assume it is paid)
    -- · SCHEDULED (first EMI is in the future) · CLOSED.
    ADD COLUMN status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' AFTER confidence,

    -- Day of the month the EMI falls. Null until supplied; start_date's day is a
    -- reasonable backfill but not a fact about every loan.
    ADD COLUMN emi_day             INT          NULL AFTER status,

    -- The account the EMI actually leaves from. Not the loan's own account.
    ADD COLUMN pay_from_account_id BIGINT       NULL AFTER emi_day,

    -- FIXED · FLOATING. The workbook records "16.5% floating", and a floating rate
    -- makes every derived figure an estimate by definition.
    ADD COLUMN rate_type           VARCHAR(20)  NOT NULL DEFAULT 'FIXED' AFTER pay_from_account_id,

    ADD COLUMN note                VARCHAR(500) NULL AFTER rate_type;

-- A rate that has not been supplied is unknown, not zero.
ALTER TABLE loans
    MODIFY COLUMN annual_rate DECIMAL(6,3) NULL;

ALTER TABLE loans
    ADD CONSTRAINT fk_loans_pay_from_account FOREIGN KEY (pay_from_account_id) REFERENCES accounts (id);

ALTER TABLE loans
    ADD CONSTRAINT ck_loans_emi_day CHECK (emi_day IS NULL OR (emi_day BETWEEN 1 AND 31));

-- Backfill: the EMI day is the one thing we can honestly infer from data already
-- held. Everything else stays at its default (ESTIMATED/ACTIVE/FIXED) or null.
UPDATE loans SET emi_day = DAY(start_date) WHERE emi_day IS NULL;
