-- ---------------------------------------------------------------------------
-- V7 : imports
--
-- Milestone 11. Staged review before anything enters the ledger - a row only ever
-- becomes a real Transaction via ImportServiceImpl.commit, through the same
-- TransactionService.create every other transaction goes through (so it gets the
-- same validation, postings, and idempotency guarantees). Scope: CSV only, fixed
-- column order. See the class comment on ImportBatch for what was deliberately left
-- out and why.
-- ---------------------------------------------------------------------------

CREATE TABLE import_batches (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    original_filename   VARCHAR(255)  NOT NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'STAGED',

    total_rows          INT           NOT NULL DEFAULT 0,
    duplicate_rows      INT           NOT NULL DEFAULT 0,
    invalid_rows        INT           NOT NULL DEFAULT 0,

    uploaded_at         DATETIME(6)   NOT NULL,
    committed_at        DATETIME(6)   NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_import_batches_user FOREIGN KEY (user_id) REFERENCES users (id),

    KEY ix_import_batches_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE import_rows (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT        NOT NULL,
    import_batch_id             BIGINT        NOT NULL,
    -- Not `row_number` - that's a reserved word in MySQL 8 (a window function).
    row_index                   INT           NOT NULL,
    raw_line                    VARCHAR(1000) NULL,

    transaction_date            DATE          NULL,
    description                 VARCHAR(200)  NULL,
    type                        VARCHAR(20)   NULL,
    amount                      DECIMAL(15,2) NULL,
    account_id                  BIGINT        NULL,
    to_account_id               BIGINT        NULL,
    category_id                 BIGINT        NULL,
    merchant                    VARCHAR(100)  NULL,
    note                        VARCHAR(500)  NULL,

    -- Set when the raw line couldn't be parsed - this row can never be committed.
    parse_error                 VARCHAR(500)  NULL,

    duplicate                   BIT(1)        NOT NULL DEFAULT b'0',
    duplicate_of_transaction_id BIGINT        NULL,
    committed_transaction_id    BIGINT        NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_import_rows_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_import_rows_batch FOREIGN KEY (import_batch_id) REFERENCES import_batches (id),
    CONSTRAINT fk_import_rows_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_import_rows_to_account FOREIGN KEY (to_account_id) REFERENCES accounts (id),
    CONSTRAINT fk_import_rows_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_import_rows_duplicate_of FOREIGN KEY (duplicate_of_transaction_id) REFERENCES transactions (id),
    CONSTRAINT fk_import_rows_committed_tx FOREIGN KEY (committed_transaction_id) REFERENCES transactions (id),

    KEY ix_import_rows_batch (import_batch_id, row_index)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
