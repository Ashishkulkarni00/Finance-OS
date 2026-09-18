-- ---------------------------------------------------------------------------
-- V2 : categories and transactions - the core money-integrity milestone
--
-- Milestone 2 of the Personal Financial Operating System.
--
-- Adds:
--   * categories          user-owned labels for grouping spending (ADR-0008)
--   * transactions         one ledger entry: date, type, amount, account(s), category
--   * postings              double-entry postings generated from a transaction;
--                            always sum to zero; the user never sees this table
--   * idempotency_keys       replay guard for POST /transactions (ADR-0014)
--
-- Postings carry no soft-delete or version of their own - they are a pure
-- derivation of their transaction's fields, regenerated whenever the transaction is
-- edited. Excluding a soft-deleted transaction's postings from a balance total is
-- done by joining to `transactions.deleted_at`, not by a flag on `postings`.
-- ---------------------------------------------------------------------------

CREATE TABLE categories (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,

    name                VARCHAR(100)  NOT NULL,
    category_group      VARCHAR(20)   NOT NULL,

    -- Provenance only (seeded at setup vs user-created) - not a lock. Seeded
    -- categories are edited and archived the same way as any other. See ADR-0008.
    system_defined      BIT(1)        NOT NULL DEFAULT b'0',
    display_order       INT           NOT NULL DEFAULT 0,

    archived_at         DATETIME(6)   NULL,

    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id),

    KEY ix_categories_user_active (user_id, deleted_at, archived_at),
    KEY ix_categories_user_name (user_id, name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE transactions (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,

    transaction_date    DATE          NOT NULL,
    type                VARCHAR(20)   NOT NULL,
    description         VARCHAR(200)  NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,

    -- The account this transaction is entered against. Source account for a transfer.
    account_id          BIGINT        NOT NULL,

    -- Destination account. Required for TRANSFER/INVESTMENT, null otherwise.
    to_account_id       BIGINT        NULL,

    -- Required for INCOME/EXPENSE/REFUND, null for TRANSFER/INVESTMENT.
    category_id         BIGINT        NULL,

    merchant            VARCHAR(100)  NULL,
    note                VARCHAR(500)  NULL,

    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_transactions_to_account FOREIGN KEY (to_account_id) REFERENCES accounts (id),
    CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories (id),

    CONSTRAINT ck_transactions_amount CHECK (amount > 0),

    -- Listing/searching a user's transactions by date range is the single most
    -- frequent query once cycles (milestone 3) resolve a transaction to a cycle.
    KEY ix_transactions_user_date (user_id, transaction_date),
    KEY ix_transactions_user_deleted (user_id, deleted_at),
    KEY ix_transactions_account (account_id),
    KEY ix_transactions_to_account (to_account_id),
    KEY ix_transactions_category (category_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE postings (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    transaction_id      BIGINT        NOT NULL,

    -- Denormalised from the owning transaction so every query here still filters on
    -- it directly, per the ownership rule - not a stored derived money value.
    user_id             BIGINT        NOT NULL,
    account_id          BIGINT        NOT NULL,

    -- Signed. Positive increases the account, negative decreases it.
    amount              DECIMAL(15,2) NOT NULL,

    created_at          DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_postings_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (id),
    CONSTRAINT fk_postings_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_postings_user FOREIGN KEY (user_id) REFERENCES users (id),

    -- The balance query: sum postings for one account, for one user.
    KEY ix_postings_account_user (account_id, user_id),
    KEY ix_postings_transaction (transaction_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE idempotency_keys (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    idempotency_key     VARCHAR(200)  NOT NULL,

    -- SHA-256 hex of the request body. A reused key with a different body is a 409,
    -- not a replay. See ADR-0014.
    request_hash        CHAR(64)      NOT NULL,
    transaction_id      BIGINT        NOT NULL,

    created_at          DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_idempotency_keys_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_idempotency_keys_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (id),

    UNIQUE KEY uk_idempotency_keys_user_key (user_id, idempotency_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


-- Starting categories for the development user. User-editable from here on -
-- system_defined records provenance only, not a lock. See ADR-0008.
INSERT INTO categories (user_id, name, category_group, system_defined, display_order, created_at, updated_at, version)
VALUES
    (1, 'Groceries',        'FLEXIBLE',   1, 1,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Dining Out',       'FLEXIBLE',   1, 2,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Transport',        'FLEXIBLE',   1, 3,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Shopping',         'FLEXIBLE',   1, 4,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Entertainment',    'FLEXIBLE',   1, 5,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Personal Care',    'FLEXIBLE',   1, 6,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Subscriptions',    'FIXED',      1, 7,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Rent',             'FIXED',      1, 8,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Loan EMI',         'FIXED',      1, 9,  UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Utilities',        'FIXED',      1, 10, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Insurance',        'FIXED',      1, 11, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Family Support',   'FIXED',      1, 12, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Travel',           'EVENT',      1, 13, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Gifts',            'EVENT',      1, 14, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0),
    (1, 'Medical',          'EVENT',      1, 15, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0);

-- NON_SPEND is a real group in the domain model, but no seeded row uses it: TRANSFER
-- and INVESTMENT transactions cannot carry a category at all (categoryId is rejected
-- for both - see TransactionType.requiresCategory()), so a NON_SPEND category would
-- be unassignable dead data. The group stays available for a user to invent one if a
-- future case needs it (e.g. distinguishing INCOME that isn't really spendable).
