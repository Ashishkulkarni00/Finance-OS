-- ---------------------------------------------------------------------------
-- V5 : loans
--
-- Milestone 7. The amortisation schedule itself is never stored - it is generated
-- from principal/rate/tenure/emi on every read (AmortisationCalculator), cheap enough
-- to not need caching. loan_payments records which transaction paid which period,
-- which is a real fact, not derived.
-- ---------------------------------------------------------------------------

CREATE TABLE loans (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    account_id          BIGINT        NOT NULL,

    lender              VARCHAR(100)  NOT NULL,
    principal           DECIMAL(15,2) NOT NULL,
    annual_rate         DECIMAL(6,3)  NOT NULL,
    tenure_months       INT           NOT NULL,
    start_date          DATE          NOT NULL,

    -- The bank's own EMI figure - typed in, not recomputed from the other fields.
    emi                 DECIMAL(15,2) NOT NULL,

    -- Card-billed EMIs are flagged so they do not double-count as cash outflow.
    paid_via            VARCHAR(20)   NOT NULL,

    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_loans_account FOREIGN KEY (account_id) REFERENCES accounts (id),

    CONSTRAINT ck_loans_principal CHECK (principal > 0),
    CONSTRAINT ck_loans_tenure CHECK (tenure_months > 0),
    CONSTRAINT ck_loans_emi CHECK (emi > 0),

    UNIQUE KEY uk_loans_account (account_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE loan_payments (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    loan_id             BIGINT        NOT NULL,
    period_number       INT           NOT NULL,
    transaction_id      BIGINT        NOT NULL,
    paid_at             DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_loan_payments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_loan_payments_loan FOREIGN KEY (loan_id) REFERENCES loans (id),
    CONSTRAINT fk_loan_payments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (id),

    UNIQUE KEY uk_loan_payments_loan_period (loan_id, period_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
