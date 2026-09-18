-- ---------------------------------------------------------------------------
-- V13 : loans are described by where they stand, not by how they began
--
-- Until now a loan was only its original terms - principal, tenure, start date - and
-- everything else was derived by counting loan_payments against them. Nothing in the
-- product can record a loan payment, so every loan read as if nothing had ever been
-- paid: a five-year-old education loan entered today showed its full original principal
-- outstanding and all 60 EMIs left. The only way to describe a loan that started before
-- you began using the app is to state its current position.
--
-- So a loan now carries a snapshot:
--   outstanding_balance  what was owed on balance_as_of
--   balance_as_of        the date that figure is true for (never in the future)
--   emis_remaining       EMIs still to pay as of that date
--   first_emi_date       the first EMI after balance_as_of
--
-- Everything is derived forward from it on read (ADR-0011): EMIs left, still to pay, the
-- payoff date, and - with a rate - outstanding today and the remaining schedule.
--
-- principal / tenure_months / start_date become optional background: useful to know,
-- never required, and no figure is derived from them any more.
--
-- Backfill reproduces each existing loan's current behaviour exactly: the snapshot is
-- the loan's own start (owed = principal, all EMIs left), and first_emi_date is the date
-- the old calculation used for EMI 1 - one month after start, on the EMI day. A start in
-- the future can't be a balance date, so balance_as_of is capped at today; first_emi_date
-- still carries the real first EMI, so the dates don't move.
-- ---------------------------------------------------------------------------

ALTER TABLE loans
    ADD COLUMN outstanding_balance DECIMAL(15,2) NULL AFTER emi,
    ADD COLUMN balance_as_of       DATE          NULL AFTER outstanding_balance,
    ADD COLUMN emis_remaining      INT           NULL AFTER balance_as_of,
    ADD COLUMN first_emi_date      DATE          NULL AFTER emis_remaining;

UPDATE loans
SET outstanding_balance = principal,
    balance_as_of       = LEAST(start_date, CURRENT_DATE),
    emis_remaining      = tenure_months,
    first_emi_date      = LEAST(
        DATE_ADD(DATE_FORMAT(DATE_ADD(start_date, INTERVAL 1 MONTH), '%Y-%m-01'),
                 INTERVAL (COALESCE(emi_day, DAY(start_date)) - 1) DAY),
        LAST_DAY(DATE_ADD(start_date, INTERVAL 1 MONTH)))
WHERE outstanding_balance IS NULL;

ALTER TABLE loans
    MODIFY COLUMN outstanding_balance DECIMAL(15,2) NOT NULL,
    MODIFY COLUMN balance_as_of       DATE          NOT NULL,
    MODIFY COLUMN emis_remaining      INT           NOT NULL;

ALTER TABLE loans
    ADD CONSTRAINT ck_loans_outstanding    CHECK (outstanding_balance >= 0),
    ADD CONSTRAINT ck_loans_emis_remaining CHECK (emis_remaining >= 0);

-- The original terms are background now. Their existing CHECKs (principal > 0,
-- tenure_months > 0) still hold for any value supplied; NULL passes a CHECK.
ALTER TABLE loans
    MODIFY COLUMN principal     DECIMAL(15,2) NULL,
    MODIFY COLUMN tenure_months INT           NULL,
    MODIFY COLUMN start_date    DATE          NULL;
