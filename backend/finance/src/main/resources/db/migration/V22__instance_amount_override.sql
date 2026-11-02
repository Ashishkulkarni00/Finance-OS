-- FIX_BACKLOG 2.9 - a one-month amount change on a fixed bill now sticks.
--
-- An occurrence copies its amount from its rule when generated, and `reconcileWithRule`
-- re-copies it on every read so that editing "Rent ₹15,000" to "₹16,000" reaches the months
-- already generated. That is right, and it is also why changing a single month silently
-- reverted: the user's ₹2,290 for October's electricity was overwritten by the rule's
-- ₹1,790 the next time Months loaded. The edit saved, appeared to work, and then undid
-- itself - the worst shape a bug can have, because nothing tells you it happened.
--
-- One flag resolves it. When the user sets an amount on one occurrence, that occurrence
-- stops taking the rule's figure. Everything else about reconciliation - the due date, and
-- every occurrence the user has not touched - is unchanged.
--
-- Deliberately a flag and not "expected_amount != rule amount". Those are equal whenever
-- the user deliberately types the usual figure, which would silently drop the override; and
-- the rule's amount is not on the row, so the comparison needs a join to mean anything. A
-- flag records the *decision*, which is the thing worth keeping.
--
-- False for every existing row: nothing has been overridden before this column existed, and
-- inferring otherwise from current data would invent decisions the user never made.
-- ---------------------------------------------------------------------------

ALTER TABLE commitment_instances
    ADD COLUMN amount_overridden BOOLEAN NOT NULL DEFAULT FALSE;
