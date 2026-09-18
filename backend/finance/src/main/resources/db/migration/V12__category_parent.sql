-- ---------------------------------------------------------------------------
-- V12 : sub-categories
--
-- A category may now sit under another category. "Transport" stays the thing you
-- compare month to month; "Fuel", "Cab", "Metro" are how you record the actual spend.
--
-- Why a self-reference and not a reuse of category_group:
--
--   category_group is a five-value enum the *calculations* depend on - FLEXIBLE is what
--   Month's flexible-spending section is computed from, INCOME is what
--   TransactionType.INCOME's category direction is enforced against. It is a rule, not
--   a label the user owns (ADR-0008). Turning it into a user-managed parent tier would
--   make every one of those rules editable from a settings screen. A parent_id adds the
--   tier the user actually asked for without touching any of that.
--
-- Constraints deliberately enforced in the service rather than here:
--
--   * one level only (a parent may not itself have a parent) - MySQL has no way to say
--     this declaratively, and a CHECK can't reach another row;
--   * a child's category_group always equals its parent's - set on write, so the
--     grouping rules above keep working whether spend is recorded on the parent or a child.
--
-- Rollup: CycleServiceImpl.flexibleSpending folds a child's spend into its parent, so
-- adding sub-categories never fragments the Month view into twenty lines.
--
-- ON DELETE RESTRICT, not CASCADE: deletes here are soft (ADR-0004) and financial
-- history is never destroyed. A parent with children is refused by the service with a
-- message saying so; the FK is the backstop if anything ever bypasses it.
-- ---------------------------------------------------------------------------

ALTER TABLE categories
    ADD COLUMN parent_id BIGINT NULL AFTER category_group;

ALTER TABLE categories
    ADD CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories (id)
        ON DELETE RESTRICT;

-- Every picker and every manage screen reads "the children of X", so this is the
-- access path, not an afterthought. user_id leads: no query ever crosses users (rule 5).
CREATE INDEX ix_categories_user_parent ON categories (user_id, parent_id);
