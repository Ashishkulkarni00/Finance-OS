-- ---------------------------------------------------------------------------
-- V10 : investments
--
-- The source workbook's Investments sheet opens with its own thesis, and this table
-- exists to honour it:
--
--   "Current Value is the only figure you keep updating by hand, and only as often as
--    you like. Leave it blank and the sheet says so rather than guessing."
--
-- So current_value is NULLABLE and carries its own as-of date. Absent means "never
-- valued", not zero, and every figure derived from it (gain, gain %) is withheld
-- rather than computed - the same gate V9 applied to loan terms, applied here to
-- valuations. ACCOUNTS_EXPERIENCE.md §8 named this as the missing piece and
-- deliberately refused to fake it from a single balance figure.
--
-- account_id is NULLABLE on purpose. The workbook's Provident Fund row has no Ledger
-- Account at all - it is an employer salary deduction that never touches an account we
-- track. A holding can be real without being a ledger account, and forcing one would
-- mean inventing an account that no money actually moves through.
-- ---------------------------------------------------------------------------

CREATE TABLE investments (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    user_id               BIGINT        NOT NULL,

    name                  VARCHAR(100)  NOT NULL,
    type                  VARCHAR(30)   NOT NULL,

    -- The INVESTMENT account this is held in. Null for holdings tracked outside the
    -- ledger entirely (EPF). When set, the account's own balance is the truth about
    -- how much has gone in - nothing here duplicates it.
    account_id            BIGINT        NULL,

    -- Where the contribution comes from. Null when nothing of ours pays it - an
    -- employer deduction never leaves an account we hold.
    pay_from_account_id   BIGINT        NULL,

    monthly_contribution  DECIMAL(15,2) NULL,
    contribution_day      INT           NULL,

    -- Only for holdings with no ledger account. Where there IS an account, its opening
    -- and current balances already answer this and storing it again would let the two
    -- drift (ADR-0011).
    stated_invested       DECIMAL(15,2) NULL,

    -- The one hand-maintained figure. Null = never valued, which is not zero.
    current_value         DECIMAL(15,2) NULL,
    current_value_as_of   DATE          NULL,

    confidence            VARCHAR(20)   NOT NULL DEFAULT 'ESTIMATED',

    -- "Not liquid - deliberately excluded from Safe to Spend", in the workbook's words.
    liquid                BOOLEAN       NOT NULL DEFAULT TRUE,

    note                  VARCHAR(500)  NULL,

    created_at            DATETIME(6)   NOT NULL,
    updated_at            DATETIME(6)   NOT NULL,
    deleted_at            DATETIME(6)   NULL,
    version               BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_investments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_investments_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_investments_pay_from FOREIGN KEY (pay_from_account_id) REFERENCES accounts (id),

    CONSTRAINT ck_investments_day CHECK (contribution_day IS NULL OR (contribution_day BETWEEN 1 AND 31)),
    CONSTRAINT ck_investments_value CHECK (current_value IS NULL OR current_value >= 0),

    -- A valued holding must say when it was valued; a stale figure the user cannot date
    -- is worse than no figure, because it looks current.
    CONSTRAINT ck_investments_valued_has_date CHECK (current_value IS NULL OR current_value_as_of IS NOT NULL),

    UNIQUE KEY uk_investments_account (account_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
