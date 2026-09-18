-- Where a bill's money goes when it isn't spent: the savings account a monthly transfer
-- lands in, or the investment account a SIP instalment buys into. Needed to pay such a
-- bill with the right kind of Ledger entry (settle_as TRANSFER / INVESTMENT, V16) and to
-- recognise that entry when it's recorded. Null for bills paid as an expense or income.

ALTER TABLE commitments
    ADD COLUMN to_account_id BIGINT NULL AFTER account_id;
