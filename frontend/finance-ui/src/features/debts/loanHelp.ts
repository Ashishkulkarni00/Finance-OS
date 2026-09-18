/**
 * One sentence per loan field: what to fill in (forms) or what the figure is (the loan's
 * page). Kept together so a figure is described the same way where it's entered and
 * where it's read. Terms follow Indian loan statements - "outstanding principal",
 * "disbursed", "EMI".
 */
export const LOAN_FIELD_HINT = {
  principal: 'The loan amount the bank sanctioned, as shown on your sanction letter.',
  rate: 'The yearly interest rate on your sanction letter; leave it blank if you don’t know it.',
  tenure: 'The total loan length in months, for example 60 for a 5-year loan.',
  startDate: 'The date the bank released the loan money to you, not the date of your first EMI.',
  originalFirstEmiDate: 'The date your very first EMI was debited, usually one month after disbursal.',
  emi: 'The monthly instalment debited for this loan, filled in from the terms above.',
  outstanding: 'The principal still unpaid on the “As of” date, called principal outstanding on your statement.',
  balanceAsOf: 'The date the outstanding principal is for; keep today unless you copied it from an older statement.',
  emisRemaining: 'How many EMIs are still to be paid after the “As of” date.',
  nextEmi: 'The date of the next EMI you haven’t paid yet.',
} as const;

export const LOAN_FIGURE_HINT = {
  outstandingToday: 'The principal still unpaid today, after every EMI whose due date has passed.',
  outstandingOn: 'The outstanding principal you entered and its date; every figure here is worked forward from it.',
  stillToPay: 'All your remaining EMIs added together, interest included.',
  emi: 'The monthly instalment debited for this loan.',
  debtFree: 'The month your last remaining EMI is due.',
  emisLeft: 'EMIs still to be paid from today; an EMI counts as paid once its due date passes.',
  nextEmi: 'The first EMI due after the outstanding principal’s date.',
  rate: 'The yearly interest rate on this loan.',
  paidFrom: 'The account your EMI is debited from.',
  principal: 'The loan amount the bank sanctioned.',
  tenure: 'The total loan length in months.',
  startDate: 'The date the bank released the loan money.',
  originalFirstEmiDate: 'The date your very first EMI was debited.',
  schedule: 'The outstanding principal left after each EMI.',
} as const;
