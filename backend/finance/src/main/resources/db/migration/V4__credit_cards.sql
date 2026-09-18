-- ---------------------------------------------------------------------------
-- V4 : credit cards
--
-- Milestone 6. Statement figures are typed in from the bank and stay authoritative;
-- outstanding, unbilled and available credit are always derived from the card
-- account's postings, never stored here. See DOMAIN_MODEL.md §2 "Cards".
-- ---------------------------------------------------------------------------

CREATE TABLE credit_card_terms (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    account_id          BIGINT        NOT NULL,

    credit_limit        DECIMAL(15,2) NOT NULL,
    -- Day of month, 1-28 - same reasoning as cycle_start_day: every month has one.
    statement_day       INT           NOT NULL,
    due_day             INT           NOT NULL,
    pay_from_account_id BIGINT        NULL,

    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_credit_card_terms_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_credit_card_terms_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_credit_card_terms_pay_from FOREIGN KEY (pay_from_account_id) REFERENCES accounts (id),

    CONSTRAINT ck_credit_card_terms_statement_day CHECK (statement_day BETWEEN 1 AND 28),
    CONSTRAINT ck_credit_card_terms_due_day CHECK (due_day BETWEEN 1 AND 28),

    -- One set of terms per card account.
    UNIQUE KEY uk_credit_card_terms_account (account_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE card_statements (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    account_id          BIGINT        NOT NULL,

    statement_date      DATE          NOT NULL,
    due_date            DATE          NOT NULL,
    total_amount        DECIMAL(15,2) NOT NULL,
    minimum_due         DECIMAL(15,2) NOT NULL,

    entered_at          DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_card_statements_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_card_statements_account FOREIGN KEY (account_id) REFERENCES accounts (id),

    CONSTRAINT ck_card_statements_total CHECK (total_amount >= 0),
    CONSTRAINT ck_card_statements_minimum CHECK (minimum_due >= 0),

    KEY ix_card_statements_account_date (account_id, statement_date DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
