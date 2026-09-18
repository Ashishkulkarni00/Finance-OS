-- ---------------------------------------------------------------------------
-- V1 : baseline - users and accounts
--
-- Milestone 1 of the Personal Financial Operating System.
--
-- Conventions established here and followed by every later migration:
--   * money            DECIMAL(15,2). Never FLOAT or DOUBLE.
--   * financial dates  DATE  (a transaction happens on a day, not an instant)
--   * audit times      DATETIME(6) in UTC
--   * ownership        every financial table carries user_id, indexed
--   * deletion         soft only, via deleted_at
--   * charset          utf8mb4 so names and notes accept any script
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255) NOT NULL,
    display_name        VARCHAR(100) NOT NULL,

    -- The salary date that defines this user's financial cycle.
    -- 28 means the cycle runs the 28th to the 27th. This is the single setting
    -- that makes the product salary-first rather than calendar-first.
    cycle_start_day     INT          NOT NULL DEFAULT 1,
    currency            VARCHAR(3)   NOT NULL DEFAULT 'INR',
    timezone            VARCHAR(64)  NOT NULL DEFAULT 'Asia/Kolkata',

    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    deleted_at          DATETIME(6)  NULL,
    version             BIGINT       NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT ck_users_cycle_start_day CHECK (cycle_start_day BETWEEN 1 AND 28)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Development user. Authentication is deferred, but the ownership column is not:
-- every financial row references a real user from the first migration onward.
INSERT INTO users (id, email, display_name, cycle_start_day, created_at, updated_at, version)
VALUES (1, 'owner@finance.local', 'Owner', 28, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0);


CREATE TABLE accounts (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT        NOT NULL,

    name                        VARCHAR(100)  NOT NULL,
    type                        VARCHAR(20)   NOT NULL,
    institution                 VARCHAR(100)  NULL,

    -- Last four digits only. Full account and card numbers are never stored.
    last_four                   VARCHAR(4)    NULL,
    currency                    VARCHAR(3)    NOT NULL DEFAULT 'INR',

    -- Opening balance is anchored PER ACCOUNT, with its own date and confidence.
    -- A single global "as at" date cannot express "I could read one bank today but
    -- not the other", which is a situation that occurs in practice.
    opening_balance             DECIMAL(15,2) NOT NULL,
    opening_as_of               DATE          NOT NULL,
    opening_confidence          VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED',

    minimum_balance             DECIMAL(15,2) NULL,
    minimum_balance_mandatory   BIT(1)        NOT NULL DEFAULT b'0',

    include_in_spendable        BIT(1)        NOT NULL DEFAULT b'1',
    include_in_net_worth        BIT(1)        NOT NULL DEFAULT b'1',

    purpose                     VARCHAR(255)  NULL,
    display_order               INT           NOT NULL DEFAULT 0,

    -- Archived: user hid it, history retained. Deleted: mistake, history retained.
    archived_at                 DATETIME(6)   NULL,

    created_at                  DATETIME(6)   NOT NULL,
    updated_at                  DATETIME(6)   NOT NULL,
    deleted_at                  DATETIME(6)   NULL,
    version                     BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id),

    -- Listing a user's accounts is the single most frequent account query.
    KEY ix_accounts_user_active (user_id, deleted_at, archived_at),

    -- Supports "does this user already have an account by this name?".
    -- Not UNIQUE: soft-deleted rows keep their names, so uniqueness is enforced
    -- in the service where the deleted_at condition can be applied.
    KEY ix_accounts_user_name (user_id, name),

    CONSTRAINT ck_accounts_currency CHECK (CHAR_LENGTH(currency) = 3),
    CONSTRAINT ck_accounts_min_balance CHECK (minimum_balance IS NULL OR minimum_balance >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
