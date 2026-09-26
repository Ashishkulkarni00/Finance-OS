-- Phase 3.2 - a warning you have answered stops speaking. See ADR-0017.
--
-- Warnings are derived on every read and never stored, which is what keeps them honest: a
-- shortfall exists because the figures say so, not because a row says so. The cost of that
-- is that "delete this warning" cannot mean anything - the next read would work it out again
-- within seconds, and the button would look broken.
--
-- So dismissal is remembered *beside* the warning rather than instead of it. The warning
-- stays true; the product stops mentioning it. insight_state already knows when a warning
-- started (first_seen_at) and when it stopped being true (cleared_at). What it could not
-- express is the third state: still true, and you have already answered it.
--
--   * dismissed_at    "I know" - silent until the situation itself changes
--   * snoozed_until   "not this week" - silent until a date, whatever happens
--
-- Deliberately two columns and not one status. They are different promises: a dismissal is
-- answered by the world changing, a snooze by the calendar. Collapsing them into one column
-- would need a second column anyway to say which kind it was.
-- ---------------------------------------------------------------------------

ALTER TABLE insight_state
    -- Set when the user says they have seen it and are leaving it as it stands.
    --
    -- It lives on the *occurrence*, not on the insight_key, and that is the whole mechanism
    -- behind "until something changes": when a warning clears and later becomes true again,
    -- the tracker opens a NEW row (a recurrence is a different event from one that never
    -- left), and the new row carries no dismissal. The warning speaks again on its own, with
    -- nothing to expire and no rule to get wrong.
    ADD COLUMN dismissed_at  DATETIME(6) NULL AFTER cleared_at,

    -- Set when the user asks for it back later. Compared against now, so no job has to run
    -- and nothing has to be cleaned up - a snooze that has passed simply stops matching.
    ADD COLUMN snoozed_until DATETIME(6) NULL AFTER dismissed_at;

-- The hot path is "which live warnings has the user already answered?", asked on every read
-- of the insight list. Narrow and user-scoped, like every other index here.
CREATE INDEX ix_insight_state_silenced
    ON insight_state (user_id, cleared_at, dismissed_at, snoozed_until);
