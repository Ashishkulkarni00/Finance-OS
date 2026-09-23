-- Phase 0.3 - the protection primitive. See ROADMAP 0.3, FINANCIAL_STATE "missing primitives".
--
-- Until now there was nowhere to record being *covered*. The only health insurance in the
-- product was a LOAN account, because the premium had been financed on a credit card -
-- which records the debt correctly and says nothing at all about the policy behind it.
-- So the app knew ₹3,998 leaves every month and had no idea what it buys.
--
-- What a policy adds that a commitment cannot express is COVER: the cost you would not
-- have to find yourself if the thing happened. That is the whole reason this is its own
-- primitive rather than another bill.
--
-- Deliberately NOT a general "protection" table. The shape is one row per thing you are
-- covered by, typed - so a device warranty or an appliance AMC fits later without a
-- migration - but nothing is built for them now.
-- ---------------------------------------------------------------------------

CREATE TABLE insurance_policies (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,

    -- HEALTH / LIFE / MOTOR / HOME / OTHER. What is covered, not who sold it.
    type                VARCHAR(20)   NOT NULL,

    -- What the user calls it - "Mom's health cover". Their words, like every other name.
    name                VARCHAR(100)  NOT NULL,
    insurer             VARCHAR(100)  NULL,

    -- Last four only, never the full policy number - the same rule as accounts (ADR-0010).
    policy_last_four    VARCHAR(4)    NULL,

    -- What you'd be covered for. NOT AN ASSET, and never added to net worth: it is money
    -- you would not have to find, not money you have. Nullable because "I'm covered but I
    -- can't remember for how much" is a true and common state (ADR-0006).
    cover_amount        DECIMAL(15,2) NULL,

    -- What it costs, and how often. Null premium is allowed: an employer policy costs the
    -- user nothing and is still worth recording, because the cover is the point.
    premium             DECIMAL(15,2) NULL,
    premium_frequency   VARCHAR(20)   NULL,

    -- When cover lapses if nothing is done. The timeline event that matters: an expired
    -- policy is the one case where the money is fine and the exposure is total.
    renews_on           DATE          NULL,

    -- Cover began - background, nothing is derived from it.
    started_on          DATE          NULL,

    -- Who it covers, in the user's words: "Mom", "me and Priya".
    covers              VARCHAR(255)  NULL,
    note                VARCHAR(255)  NULL,

    -- A premium financed on a card is a real debt and stays a real loan; this only records
    -- that the two are the same arrangement, so the loan's page can say what it bought.
    -- ON DELETE SET NULL: deleting the loan must not delete the policy - the cover outlives
    -- the instalments.
    loan_id             BIGINT        NULL,

    archived_at         DATETIME(6)   NULL,
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    deleted_at          DATETIME(6)   NULL,
    version             BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_insurance_policies_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_insurance_policies_loan FOREIGN KEY (loan_id) REFERENCES loans (id)
        ON DELETE SET NULL,
    CONSTRAINT ck_insurance_policies_cover CHECK (cover_amount IS NULL OR cover_amount > 0),
    CONSTRAINT ck_insurance_policies_premium CHECK (premium IS NULL OR premium > 0),

    KEY ix_insurance_policies_user_active (user_id, deleted_at),
    -- "What renews next" - the timeline's query.
    KEY ix_insurance_policies_renewal (user_id, renews_on)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
