-- Phase 0.1 - plans are versioned. See ADR-0015.
--
-- Until now a plan could be rewritten silently. Editing a commitment either mutated the
-- rule in place (the old amount simply ceased to exist) or split it into a second,
-- unlinked row that no reader could tell was the same bill. A goal's target date could
-- move by a year and leave no trace. And a closed cycle stored only actuals, so it could
-- not be compared against the plan that was in force during it, even in principle.
--
-- These two tables record the change itself as a financial event: what moved, when it was
-- decided, when it takes effect, why, and - the part that makes it a financial record
-- rather than an audit trail - what it costs per month.
--
--   * plan_revisions          the decision
--   * plan_revision_changes   the fields that moved, one row each
--   * cycle_snapshots +5      planned totals beside the actuals already there
-- ---------------------------------------------------------------------------

CREATE TABLE plan_revisions (
    id                     BIGINT        NOT NULL AUTO_INCREMENT,
    user_id                BIGINT        NOT NULL,

    -- COMMITMENT or GOAL. Deliberately NOT a foreign key: it is polymorphic, and it must
    -- outlive a deleted subject. A plan line's history surviving the line is the point -
    -- deleting a commitment writes an ENDED revision, it does not erase the ones before.
    subject_type           VARCHAR(20)   NOT NULL,
    subject_id             BIGINT        NOT NULL,

    -- Kept so the log still reads correctly once the subject is gone and its name with it.
    subject_name           VARCHAR(100)  NOT NULL,

    -- CREATED / AMENDED / SUPERSEDED / PAUSED / RESUMED / ENDED / SYNCED.
    -- AMENDED changes the line everywhere, including months already past; SUPERSEDED ends
    -- the old rule and starts a new one from a date, so history keeps the figures that
    -- were true at the time. Nothing recorded which had happened until now.
    revision_type          VARCHAR(20)   NOT NULL,

    -- On SUPERSEDED, the rule this one replaced. Walking this backwards gives every
    -- version of a plan line, which is why `commitments` needs no column of its own -
    -- the revision IS the relationship, and storing it twice gives two places to disagree.
    superseded_subject_id  BIGINT        NULL,

    decided_at             DATETIME(6)   NOT NULL,
    effective_from         DATE          NOT NULL,

    -- The cycle the decision was made in. Nullable, and resolved existing-only: recording
    -- history must never bring a cycle into being as a side effect.
    cycle_id               BIGINT        NULL,

    -- The user's own words. Never demanded - a forced "why did you change this?" produces
    -- "." as an answer - so null is honest and common.
    reason                 VARCHAR(255)  NULL,

    -- What the decision costs per month: positive means more money is needed each month.
    -- An INCOME commitment is negated (expecting more salary lowers the requirement).
    -- NULL means UNKNOWN, never zero - a VARIABLE commitment has no monthly figure to
    -- compare against, and "+0.00" would be a confident wrong answer. ADR-0006.
    monthly_effect         DECIMAL(15,2) NULL,

    created_at             DATETIME(6)   NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_plan_revisions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_plan_revisions_cycle FOREIGN KEY (cycle_id) REFERENCES cycles (id),

    -- The whole log, newest first.
    KEY ix_plan_revisions_user_decided (user_id, decided_at),
    -- One plan line's history. Two keys, because findForSubject matches either side:
    -- a superseded rule still turns up when its replacement is asked about.
    KEY ix_plan_revisions_subject (user_id, subject_type, subject_id),
    KEY ix_plan_revisions_superseded (user_id, subject_type, superseded_subject_id),
    -- "What changed this month", and the snapshot's plan_revisions_count at close.
    KEY ix_plan_revisions_cycle (user_id, cycle_id),
    -- Decided but not yet in force - what a forward-looking view needs.
    KEY ix_plan_revisions_effective (user_id, effective_from)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE plan_revision_changes (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    revision_id  BIGINT       NOT NULL,

    -- The stable key code matches on - `fixedAmount`, `targetDate`.
    `field`      VARCHAR(50)  NOT NULL,
    -- What a person calls it - "Amount", "Last payment". Written by the domain service
    -- that made the change, because the commitment package is the only thing that knows
    -- `activeTo` reads "Last payment" to a person. ADR-0015.
    label        VARCHAR(60)  NOT NULL,

    -- MONEY / DATE / NUMBER / TEXT / FLAG. One column has to hold a name, a date, a flag
    -- and an amount, so values are strings (money in its canonical "4200.00" form,
    -- ADR-0001); this carries the meaning VARCHAR loses, so the UI formats without
    -- guessing from the shape of the text.
    value_kind   VARCHAR(20)  NOT NULL,

    -- NULL on old_value means the field had no value before - not that it was zero or
    -- blank. NULL on new_value means it was cleared.
    old_value    VARCHAR(255) NULL,
    new_value    VARCHAR(255) NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_plan_revision_changes_revision
        FOREIGN KEY (revision_id) REFERENCES plan_revisions (id),
    KEY ix_plan_revision_changes_revision (revision_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


-- Everything already on cycle_snapshots is an ACTUAL. These are the plan it is measured
-- against, captured at close from the cycle's own commitment_instances.
--
-- All five are NULL-able on purpose, with no DEFAULT. A cycle that closed before this
-- existed planned nothing we know about; DEFAULT 0 would make every past month
-- permanently claim it planned nothing and kept nothing, in a row that is never rewritten.
-- NULL here means "not recorded", which is true. ADR-0006.
ALTER TABLE cycle_snapshots
    -- What the cycle's commitments were expected to cost. NULL when any one of them had
    -- no known amount - a total with the unknowns silently dropped would be wrong forever.
    ADD COLUMN planned_committed_total DECIMAL(15,2) NULL AFTER total_debt,
    -- What they actually cost - confirmed amounts only.
    ADD COLUMN actual_committed_total  DECIMAL(15,2) NULL AFTER planned_committed_total,
    ADD COLUMN commitments_planned     INT           NULL AFTER actual_committed_total,
    -- Paid, or settled in an earlier cycle. The operational form of the North Star:
    -- commitments kept is the number that has to go up.
    ADD COLUMN commitments_kept        INT           NULL AFTER commitments_planned,
    -- How many times the plan itself changed during the cycle - why this month may not be
    -- comparable with the last.
    ADD COLUMN plan_revisions_count    INT           NULL AFTER commitments_kept;
