-- Phase 0.4 - a warning is announced when it crosses, not while it is true. See ADR-0017.
--
-- InsightService derives what needs attention on every read and forgets it immediately.
-- That is correct for a dashboard the user chooses to open, and wrong for a system that
-- speaks at the moment of a write: with no memory, the same warning fires on every
-- transaction recorded while the condition persists. A person learns to dismiss that
-- within two days, and the channel the product most needs is then dead.
--
-- This table is the memory. It records WHAT THE PRODUCT HAS ALREADY SAID - not a derived
-- financial value. Room, runway, goal feasibility and obligation cover are still computed
-- fresh on every read (ADR-0011); nothing here can drift from them, because nothing here
-- is a figure anyone reads money out of.
--
-- A key that appears = something just became true.  A key that disappears = a recovery,
-- which is worth saying too: "Bangalore trip is no longer behind" has never been sayable.
--
-- Phase 2.2 (dismiss / snooze) extends this table rather than adding another.
-- ---------------------------------------------------------------------------

CREATE TABLE insight_state (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,

    -- Insight.key - "goal:6:pace", "instance:31:overdue". Already stable, and already
    -- documented in Insight.java as existing for exactly this. Deliberately NOT a foreign
    -- key to anything: the key is polymorphic across rules and must outlive the goal,
    -- instance or card it names, or a warning could never be recorded as having cleared
    -- because the thing it was about is gone.
    insight_key      VARCHAR(100) NOT NULL,

    -- InsightType and Severity as they were when this occurrence began. Severity is
    -- updated in place if it escalates (ATTENTION -> CRITICAL is itself worth announcing);
    -- it is never lowered on an active row, because quietly downgrading a live warning
    -- would make it disappear from the user's view with nothing said.
    insight_type     VARCHAR(40)  NOT NULL,
    severity         VARCHAR(20)  NOT NULL,

    -- What was actually said, frozen. An active insight can be re-derived; a cleared one
    -- cannot, and "you were warned about X on the 3rd" is unreadable without the words.
    title            VARCHAR(200) NOT NULL,

    -- When it became true. This is the announcement: in 0.4 a crossing is detected and
    -- reported in the same write response, so there is deliberately no separate
    -- announced_at until something (a scheduler, a digest) can detect without telling.
    first_seen_at    DATETIME(6)  NOT NULL,

    -- The last evaluation that still found it true. Distinguishes "still true" from
    -- "stale row nobody has looked at", which matters once time-based triggers exist.
    last_seen_at     DATETIME(6)  NOT NULL,

    -- When it stopped being true. NULL means it is live right now. A recurrence opens a
    -- NEW row rather than reopening this one - a warning that came back is a different
    -- event from one that never left, and flattening the two loses the pattern.
    cleared_at       DATETIME(6)  NULL,

    created_at       DATETIME(6)  NOT NULL,

    -- One live occurrence per warning, enforced here rather than trusted to the service.
    -- Two active rows for one key would announce the same thing twice, which is the exact
    -- failure this table exists to prevent. Cleared rows carry NULL and so never collide,
    -- which is what makes history possible alongside the constraint.
    active_key       VARCHAR(100) GENERATED ALWAYS AS
                         (IF(cleared_at IS NULL, insight_key, NULL)) STORED,

    PRIMARY KEY (id),
    CONSTRAINT fk_insight_state_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_insight_state_active UNIQUE (user_id, active_key),

    -- The diff on every write: everything live for this user, to compare against what the
    -- rules just produced. This is the hot path - it runs on each reported write.
    KEY ix_insight_state_live (user_id, cleared_at),
    -- One warning's history: how often it recurs, how long it lasts.
    KEY ix_insight_state_key (user_id, insight_key, first_seen_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
