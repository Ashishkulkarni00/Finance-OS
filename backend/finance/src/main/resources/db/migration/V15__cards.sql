-- ---------------------------------------------------------------------------
-- V15 : cards - debit cards, card network, correctable statements
--
-- A credit card is its own account (CREDIT_CARD, a liability) with terms - V4. It is
-- not attached to a bank account: the bank it's usually paid from is a suggestion only.
--
-- A debit card is the opposite: it has no balance of its own. It is a way of spending
-- from one bank account, so it belongs to that account and nothing is derived from it -
-- spends on it are expenses from the bank account.
--
-- Card statements gain soft delete (ADR-0004): a statement typed in wrong is withdrawn
-- and entered again, never destroyed.
-- ---------------------------------------------------------------------------

ALTER TABLE credit_card_terms
    ADD COLUMN network VARCHAR(20) NULL AFTER due_day;

ALTER TABLE card_statements
    ADD COLUMN deleted_at DATETIME(6) NULL AFTER entered_at;

CREATE TABLE debit_cards (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    -- The bank account this card spends from. Never a card or loan account.
    account_id  BIGINT       NOT NULL,

    name        VARCHAR(100) NOT NULL,
    network     VARCHAR(20)  NULL,
    -- Last four digits only - never the full number, expiry or CVV (CLAUDE.md rule 9).
    last_four   CHAR(4)      NULL,

    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    deleted_at  DATETIME(6)  NULL,
    version     BIGINT       NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_debit_cards_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_debit_cards_account FOREIGN KEY (account_id) REFERENCES accounts (id),

    KEY ix_debit_cards_user (user_id),
    KEY ix_debit_cards_account (account_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
