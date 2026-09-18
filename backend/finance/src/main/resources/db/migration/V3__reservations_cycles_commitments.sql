-- ---------------------------------------------------------------------------
-- V3 : reservations, cycles, commitments - the engine
--
-- Milestone 3 of the Personal Financial Operating System.
--
-- Adds:
--   * reservations           money physically present but set aside (emergency fund)
--   * cycles                  the salary-cycle boundary, lazily materialised per user
--   * cycle_snapshots         the one deliberate exception to "never store derived
--                             values" - an immutable record of a closed cycle
--   * commitments             the RULE ("ZestMoney EMI, mandatory, due the 5th")
--   * commitment_instances    the OCCURRENCE (this cycle's instance of that rule) -
--                             the split that makes a confirmation cycle-scoped and
--                             stops it leaking forward, per DOMAIN_MODEL.md §2
-- ---------------------------------------------------------------------------

CREATE TABLE reservations (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    account_id          BIGINT        NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    purpose             VARCHAR(255)  NOT NULL,

    -- Not yet a real foreign key - Goal does not exist until milestone 10.
    -- The constraint is added then; the column exists now to avoid a later ALTER.
    goal_id             BIGINT        NULL,

    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_reservations_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT ck_reservations_amount CHECK (amount > 0),

    KEY ix_reservations_user_active (user_id, deleted_at),
    KEY ix_reservations_account (account_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE cycles (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    start_date          DATE          NOT NULL,
    end_date            DATE          NOT NULL,

    -- Set once, at close. Never reopened.
    closed_at           DATETIME(6)   NULL,

    created_at          DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_cycles_user FOREIGN KEY (user_id) REFERENCES users (id),

    -- Find-or-create by user + start date is the only lookup this table needs.
    UNIQUE KEY uk_cycles_user_start (user_id, start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE cycle_snapshots (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    cycle_id            BIGINT        NOT NULL,

    income_total        DECIMAL(15,2) NOT NULL,
    expense_total       DECIMAL(15,2) NOT NULL,
    invested_total      DECIMAL(15,2) NOT NULL,
    transferred_total   DECIMAL(15,2) NOT NULL,
    net                 DECIMAL(15,2) NOT NULL,

    -- Null when income was zero for the cycle - not a fact, never shown as 0%.
    savings_rate        DECIMAL(7,4)  NULL,

    -- Null only if Real Balance could not compute at close time (a mandatory
    -- instance's amount was still unknown) - the snapshot honestly records that too.
    real_balance        DECIMAL(15,2) NULL,

    net_worth           DECIMAL(15,2) NOT NULL,
    total_debt          DECIMAL(15,2) NOT NULL,

    created_at          DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_cycle_snapshots_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_cycle_snapshots_cycle FOREIGN KEY (cycle_id) REFERENCES cycles (id),

    -- One snapshot per cycle, ever - closing is a one-time event.
    UNIQUE KEY uk_cycle_snapshots_cycle (cycle_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE commitments (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT        NOT NULL,
    name                        VARCHAR(100)  NOT NULL,

    amount_type                 VARCHAR(20)   NOT NULL,
    -- Required when amount_type = FIXED, null when VARIABLE.
    fixed_amount                DECIMAL(15,2) NULL,

    frequency                   VARCHAR(20)   NOT NULL,
    -- Calendar day of month, 1-28 - same constraint as a user's cycle_start_day, for
    -- the same reason: every month has at least 28 days, so no edge case to handle.
    due_day                     INT           NOT NULL,

    account_id                  BIGINT        NOT NULL,
    category_id                 BIGINT        NULL,

    mandatory                   BIT(1)        NOT NULL DEFAULT b'1',
    -- A requires_verification commitment can never auto-reach PAID - see
    -- CommitmentInstanceStatus's state diagram.
    requires_verification       BIT(1)        NOT NULL DEFAULT b'0',

    active_from                 DATE          NOT NULL,
    active_to                   DATE          NULL,

    archived_at                 DATETIME(6)   NULL,

    created_at                  DATETIME(6)   NOT NULL,
    updated_at                  DATETIME(6)   NOT NULL,
    deleted_at                  DATETIME(6)   NULL,
    version                     BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_commitments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_commitments_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_commitments_category FOREIGN KEY (category_id) REFERENCES categories (id),

    CONSTRAINT ck_commitments_due_day CHECK (due_day BETWEEN 1 AND 28),
    CONSTRAINT ck_commitments_fixed_amount CHECK (fixed_amount IS NULL OR fixed_amount > 0),

    KEY ix_commitments_user_active (user_id, deleted_at, archived_at),
    KEY ix_commitments_active_range (user_id, active_from, active_to)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE commitment_instances (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    commitment_id       BIGINT        NOT NULL,
    cycle_id            BIGINT        NOT NULL,

    due_date            DATE          NOT NULL,
    -- Null only for a VARIABLE commitment not yet confirmed - blocks Real Balance
    -- from computing while this instance is open and its commitment is mandatory.
    expected_amount     DECIMAL(15,2) NULL,

    status              VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    confirmed_amount    DECIMAL(15,2) NULL,
    confirmed_at        DATETIME(6)   NULL,
    linked_transaction_id BIGINT      NULL,

    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_commitment_instances_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_commitment_instances_commitment FOREIGN KEY (commitment_id) REFERENCES commitments (id),
    CONSTRAINT fk_commitment_instances_cycle FOREIGN KEY (cycle_id) REFERENCES cycles (id),
    CONSTRAINT fk_commitment_instances_transaction FOREIGN KEY (linked_transaction_id) REFERENCES transactions (id),

    -- One instance per commitment per cycle - generation is idempotent by construction.
    -- This is the row that makes a confirmation valid only for its own cycle (rule 11).
    UNIQUE KEY uk_commitment_instances_commitment_cycle (commitment_id, cycle_id),

    KEY ix_commitment_instances_cycle_user (cycle_id, user_id),
    KEY ix_commitment_instances_user_status (user_id, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
