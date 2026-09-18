-- Preview / delete temporary ZZ test rows in the dev DB (finance_planner). Only rows on LIVE ZZ accounts.
-- Usage: mysql --defaults-extra-file=<file with [client] user/password> finance_planner < zz-cleanup.sql
-- Run the PREVIEW block alone first (comment out DELETE block) and check 'non-ZZ ... caught' are 0.
-- The investments/goals date filter must be set to the day the ZZ rows were made.

-- PREVIEW
-- PREVIEW
SELECT 'accounts' t, COUNT(*) FROM accounts WHERE id IN (SELECT id FROM (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) a) UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions WHERE id IN (SELECT transaction_id FROM (SELECT DISTINCT p.transaction_id FROM postings p JOIN accounts x ON x.id=p.account_id WHERE x.name LIKE 'ZZ%' AND x.deleted_at IS NULL AND deleted_at IS NULL) t) UNION ALL
SELECT 'non-ZZ tx caught', COUNT(*) FROM transactions WHERE id IN (SELECT transaction_id FROM (SELECT DISTINCT p.transaction_id FROM postings p JOIN accounts x ON x.id=p.account_id WHERE x.name LIKE 'ZZ%' AND x.deleted_at IS NULL AND deleted_at IS NULL) t) AND description NOT LIKE 'ZZ%' UNION ALL
SELECT 'commitments', COUNT(*) FROM commitments WHERE id IN (SELECT id FROM (SELECT c.id FROM commitments c WHERE c.account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) OR c.to_account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL)) c) UNION ALL
SELECT 'non-ZZ commitments caught', COUNT(*) FROM commitments WHERE id IN (SELECT id FROM (SELECT c.id FROM commitments c WHERE c.account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) OR c.to_account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL)) c) AND name NOT LIKE 'ZZ%' UNION ALL
SELECT 'instances', COUNT(*) FROM commitment_instances WHERE commitment_id IN (SELECT id FROM (SELECT c.id FROM commitments c WHERE c.account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) OR c.to_account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL)) c) UNION ALL
SELECT 'investments', COUNT(*) FROM investments WHERE name LIKE 'ZZ%' UNION ALL
SELECT 'goals', COUNT(*) FROM goals WHERE name LIKE 'ZZ%' UNION ALL
SELECT 'loans on ZZ', COUNT(*) FROM loans WHERE account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) UNION ALL
SELECT 'loan_payments', COUNT(*) FROM loan_payments WHERE loan_id IN (SELECT l.id FROM loans l JOIN accounts x ON x.id=l.account_id WHERE x.name LIKE 'ZZ%' AND x.deleted_at IS NULL);

-- DELETE
DELETE FROM commitment_instances WHERE commitment_id IN (SELECT id FROM (SELECT c.id FROM commitments c WHERE c.account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) OR c.to_account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL)) c) OR linked_transaction_id IN (SELECT transaction_id FROM (SELECT DISTINCT p.transaction_id FROM postings p JOIN accounts x ON x.id=p.account_id WHERE x.name LIKE 'ZZ%' AND x.deleted_at IS NULL AND deleted_at IS NULL) t);
DELETE FROM idempotency_keys WHERE transaction_id IN (SELECT transaction_id FROM (SELECT DISTINCT p.transaction_id FROM postings p JOIN accounts x ON x.id=p.account_id WHERE x.name LIKE 'ZZ%' AND x.deleted_at IS NULL AND deleted_at IS NULL) t);
CREATE TEMPORARY TABLE zz_tx AS SELECT DISTINCT p.transaction_id id FROM postings p JOIN accounts x ON x.id=p.account_id WHERE x.name LIKE 'ZZ%' AND x.deleted_at IS NULL;
DELETE FROM postings WHERE transaction_id IN (SELECT id FROM zz_tx);
DELETE FROM transactions WHERE id IN (SELECT id FROM zz_tx);
DELETE FROM commitments WHERE id IN (SELECT id FROM (SELECT c.id FROM commitments c WHERE c.account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) OR c.to_account_id IN (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL)) c);
DELETE FROM investments WHERE name LIKE 'ZZ%' AND created_at >= '2026-09-17';
DELETE FROM goals WHERE name LIKE 'ZZ%' AND created_at >= '2026-09-17';
DELETE FROM loans WHERE account_id IN (SELECT id FROM (SELECT id FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) a);
DELETE FROM categories WHERE name LIKE 'ZZ%' AND created_at >= '2026-09-17';
DELETE FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL;
SELECT (SELECT COUNT(*) FROM accounts WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) + (SELECT COUNT(*) FROM commitments WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) + (SELECT COUNT(*) FROM transactions WHERE description LIKE 'ZZ%') + (SELECT COUNT(*) FROM investments WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) + (SELECT COUNT(*) FROM goals WHERE name LIKE 'ZZ%' AND deleted_at IS NULL) AS zz_left;
