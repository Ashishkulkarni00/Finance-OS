-- ---------------------------------------------------------------------------
-- V11 : income categories
--
-- CategoryGroup gained INCOME (Java enum, no schema change needed - category_group
-- is stored as VARCHAR). Two things follow:
--
-- 1. "Salary Credit" was seeded in V2 into FLEXIBLE - a discretionary-spending group -
--    because no income group existed for it to belong to. INCOME.requiresCategory()
--    was already true, so every salary transaction has been miscategorised since M2.
--    Re-grouped here, not deleted: the category and every transaction against it are
--    untouched, only its group changes.
--
-- 2. INCOME transactions need real choices beyond "Salary Credit" - freelance work,
--    interest, and a catch-all. Seeded the same way V2 seeded the rest: user-editable
--    from here on, system_defined records provenance only (ADR-0008).
--
-- TransactionServiceImpl now enforces the direction (LEDGER_IMPROVEMENT_PLAN §2 P2):
-- INCOME requires a category from this group, EXPENSE/REFUND forbid one from it.
-- ---------------------------------------------------------------------------

UPDATE categories
SET category_group = 'INCOME'
WHERE name = 'Salary Credit' AND category_group = 'FLEXIBLE';

INSERT INTO categories (user_id, name, category_group, system_defined, display_order, created_at, updated_at, version)
SELECT 1, 'Freelance', 'INCOME', 1, 16, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id = 1 AND name = 'Freelance');

INSERT INTO categories (user_id, name, category_group, system_defined, display_order, created_at, updated_at, version)
SELECT 1, 'Interest', 'INCOME', 1, 17, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id = 1 AND name = 'Interest');

INSERT INTO categories (user_id, name, category_group, system_defined, display_order, created_at, updated_at, version)
SELECT 1, 'Other Income', 'INCOME', 1, 18, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), 0
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id = 1 AND name = 'Other Income');
