-- ---------------------------------------------------------------------------
-- V14 : the first EMI of the original loan
--
-- A loan's start date is when the money was disbursed. The first EMI is normally a month
-- later - but not always (lenders move it to align with a salary date, or add a broken
-- period), and it is the date EMIs are actually counted from. So it is recorded on its
-- own rather than inferred every time from the disbursal date.
--
-- Used to work out, from the original terms, how many EMIs have gone out, what is left,
-- the next EMI and the outstanding principal today (POST /loans/estimate). Background
-- like the other original terms: nothing on read is derived from it (V13).
--
-- Backfill: one month after disbursal, on the EMI day - the same assumption the loan
-- already made - for loans whose start date is known.
-- ---------------------------------------------------------------------------

ALTER TABLE loans
    ADD COLUMN original_first_emi_date DATE NULL AFTER start_date;

UPDATE loans
SET original_first_emi_date = LEAST(
        DATE_ADD(DATE_FORMAT(DATE_ADD(start_date, INTERVAL 1 MONTH), '%Y-%m-01'),
                 INTERVAL (COALESCE(emi_day, DAY(start_date)) - 1) DAY),
        LAST_DAY(DATE_ADD(start_date, INTERVAL 1 MONTH)))
WHERE start_date IS NOT NULL
  AND original_first_emi_date IS NULL;
