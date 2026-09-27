import type { DocTopic } from '../types';

/**
 * Loans & EMIs (Phase A shipped one seed topic here, `loans.understanding-a-loan`, only so
 * the required `loan.card` anchor resolved to something real - see the file's original
 * header note, now superseded). Phase B promotes it into the full category and adds the
 * topics `contextMap.ts` already pointed at (`loans.what-an-emi-is`,
 * `loans.outstanding-vs-remaining`, `loans.adding-a-loan`) before they existed.
 *
 * Source: `features/debts/components/LoanRow.tsx`, `ConfidencePill.tsx`, `AddLoanSheet.tsx`
 * and `LoanStateFields.tsx`.
 */
export const LOANS_TOPICS: DocTopic[] = [
  {
    id: 'loans.understanding-a-loan',
    category: 'loans',
    slug: 'understanding-a-loan',
    title: 'Reading a loan row',
    summary: 'The payoff countdown, not the raw balance, is the headline - and every figure on the row says plainly whether it comes from real terms or an estimate.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A loan’s row leads with its payoff countdown - how much is repaid so far, and when it will be debt-free - rather than a bare outstanding balance. Watching a number go down is not the same as watching a finish line get closer, and the second one is what actually helps.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'That countdown only appears once Kosh has the loan’s real terms - the interest rate in particular. Without it, the row says plainly "payoff date needs the real terms" rather than showing a date built on a guess.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Confirmed', means: 'Terms taken from the sanction letter or a statement. Every figure is derived from them.' },
              { term: 'Estimated', means: 'Worked out from what you entered, not paperwork. Close, not exact.' },
              { term: 'Terms not supplied', means: 'No interest rate yet - the EMI and payments left are known, but the payoff date and amount repaid are not shown.' },
            ],
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'example',
            title: 'A bike loan, 14 of 36 EMIs paid',
            lines: [
              { label: 'EMI', value: '₹6,145 /mo' },
              { label: 'Repaid so far', value: '₹86,030' },
              { label: 'Debt-free', value: 'Nov 2028' },
              { label: 'Terms', value: 'Confirmed' },
            ],
            note: 'Every one of these comes from the sanction letter’s rate and tenure, plus the EMIs actually recorded - never from the raw outstanding balance alone.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'callout',
            tone: 'warn',
            text: 'A loan’s balance moves only when a payment is recorded against it - never automatically on the due date. An EMI that has not been recorded is flagged, never assumed to have gone through.',
          },
          {
            kind: 'qa',
            items: [
              {
                question: 'How do I record an EMI I have paid?',
                answer: 'As an Expense from the bank account it left, in the loan EMI category - or by settling it from Months if it is set up as a bill there. Never as a transfer to the loan.',
              },
              {
                question: 'How do I record paying extra towards a loan?',
                answer: 'As a Transfer from your bank account to the loan account - that is a prepayment, and it reduces what you owe.',
              },
            ],
          },
        ],
      },
    ],
    related: ['loans.what-an-emi-is', 'loans.outstanding-vs-remaining', 'spending.card-purchases-vs-paying-the-bill'],
    seeInApp: [{ label: 'Open Debts', to: '/money/debts' }],
  },
  {
    id: 'loans.what-an-emi-is',
    category: 'loans',
    slug: 'what-an-emi-is',
    title: 'What an EMI is',
    summary: 'The fixed monthly amount a loan asks for - part of it clearing interest, part reducing what you actually owe.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'An EMI (equated monthly instalment) is the fixed amount a loan asks for each month. Part of every EMI clears interest for that month; the rest reduces the principal - the amount you actually borrowed and still owe.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Kosh shows the EMI itself on a loan’s row so you always know what leaves each month, and - once the loan has real terms - the full interest/principal split on the loan’s own page, worked out from the rate and start date rather than typed in.',
          },
          {
            kind: 'example',
            title: 'This month’s EMI on the bike loan, split',
            lines: [
              { label: 'Outstanding before', value: '₹1,77,276' },
              { label: 'Interest (16.5% ÷ 12, one month)', value: '₹2,438' },
              { label: 'Principal (the rest of the EMI)', value: '₹3,707' },
              { label: 'Outstanding after', value: '₹1,73,569' },
            ],
            note: '₹1,77,276 × 16.5% ÷ 12 = ₹2,438 interest for the month; ₹6,145 − ₹2,438 = ₹3,707 comes off the principal - the same reducing-balance method the loan’s own schedule uses.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'qa',
            items: [
              {
                question: 'Why isn’t each EMI split into principal and interest on the row itself?',
                answer:
                  'The split needs the real rate and start date. With them, the loan’s own page shows the full schedule; without them, a made-up split would be worse than none.',
              },
              {
                question: 'Why isn’t a card EMI added to what leaves every month?',
                answer:
                  'It arrives inside your card bill, and paying the card bill is already how that money leaves. Adding it again would count the same money twice.',
              },
              {
                question: 'The EMI I entered doesn’t match what the standard formula gives',
                answer:
                  'Kosh flags this rather than silently using either figure: "For this amount, rate and tenure the EMI works out to ₹X. If ₹Y is right, the rate or tenure is probably different." Your own figure is kept either way.',
              },
            ],
          },
        ],
      },
    ],
    related: ['loans.understanding-a-loan', 'loans.outstanding-vs-remaining', 'loans.adding-a-loan'],
    seeInApp: [{ label: 'Open Debts', to: '/money/debts' }],
  },
  {
    id: 'loans.outstanding-vs-remaining',
    category: 'loans',
    slug: 'outstanding-vs-remaining',
    title: 'Outstanding vs. still to pay',
    summary: 'Outstanding is the principal left to repay. "Still to pay" is every EMI still to come, added up - and the two are rarely the same number.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Outstanding is the loan’s remaining principal - what you actually still owe the lender, before any future interest. "Still to pay" is a different figure: every EMI still to come, added up, including the interest each one will carry.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A loan with 14 EMIs left',
            lines: [
              { label: 'Outstanding principal', value: '₹78,200' },
              { label: 'EMIs left', value: '14' },
              { label: 'Still to pay (14 × ₹6,145)', value: '₹86,030' },
            ],
            note: 'The difference, ₹7,830, is interest still to be charged over the remaining EMIs - it stays knowable from the EMI and count alone, even before the loan has a confirmed rate.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'qa',
            items: [
              {
                question: 'Which figure should I use to decide whether to prepay?',
                answer: 'Outstanding - it is what a lender would actually ask for to close the loan today. "Still to pay" includes interest you would no longer owe if you closed it now.',
              },
              {
                question: 'Why is there no payoff date?',
                answer: 'The loan has no interest rate recorded. A payoff date worked out from a guessed rate would look exact and be wrong, so none is shown. Add the rate from the sanction letter and it appears.',
              },
            ],
          },
        ],
      },
    ],
    related: ['loans.understanding-a-loan', 'loans.what-an-emi-is'],
    seeInApp: [{ label: 'Open Debts', to: '/money/debts' }],
  },
  {
    id: 'loans.adding-a-loan',
    category: 'loans',
    slug: 'adding-a-loan',
    title: 'Adding a loan',
    summary: 'The terms from your sanction letter, then where the loan stands today - with everything Kosh can work out already filled in.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Adding a loan creates two things at once: the LOAN account that carries the debt itself, opened at what you currently owe, and the loan’s own record of its terms and schedule.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Fill in what you know from the sanction letter and Kosh works out the rest - the first EMI date, EMIs already gone, EMIs left, the next EMI date and the outstanding principal as of today. Anything you type yourself is kept as yours and never silently overwritten; if the numbers disagree, Kosh offers the calculated ones rather than replacing what you entered.',
          },
          {
            kind: 'example',
            title: 'Adding the bike loan from its sanction letter',
            lines: [
              { label: 'Loan amount', value: '₹2,14,886' },
              { label: 'Interest', value: '16.5%' },
              { label: 'Tenure', value: '48 months' },
              { label: 'EMI (worked out)', value: '₹6,145' },
            ],
            note: 'Kosh works out ₹6,145 the moment the amount, rate and tenure are entered - the standard lender formula. Typing in your own EMI instead is kept as yours if it differs.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: 'The "Add a loan" form. "Loan terms" is what you know from the sanction letter; "Where it stands" is worked out from it.',
            items: [
              { label: 'Loan', what: 'A name you will recognise.', example: 'Bike loan, education loan…', requirement: 'required' },
              { label: 'Lender', what: 'Who lent it to you.', example: 'HDFC, SBI, Bajaj…', requirement: 'required' },
              { label: 'Loan amount', what: 'The full sanctioned amount, if you know it.', requirement: 'optional' },
              { label: 'Interest', what: 'The annual rate. Leave it blank if you do not know it - without it, Kosh cannot show a payoff date.', requirement: 'optional' },
              { label: 'Tenure', what: 'How many months the loan runs for.', requirement: 'optional' },
              { label: 'Disbursed on', what: 'The date the loan was paid out.', requirement: 'optional' },
              { label: 'First EMI', what: 'The date of the very first instalment. Worked out from "Disbursed on" once you have entered it.', requirement: 'auto' },
              { label: 'EMI', what: 'The fixed monthly instalment. Worked out from the amount, rate and tenure once you have entered them.', requirement: 'auto' },
              { label: 'Outstanding', what: 'What you owe right now. Worked out from the terms above if you have filled them in; otherwise enter it from your latest statement.', requirement: 'auto' },
              { label: 'As of', what: 'The date the outstanding figure is true for.', requirement: 'required' },
              { label: 'EMIs left', what: 'How many instalments remain. Worked out from the terms once known.', requirement: 'auto' },
              { label: 'Next EMI', what: 'The date of the next instalment. Worked out once known.', requirement: 'auto' },
              { label: 'Paid via', what: '"Debited from a bank account" or "Billed to a card".', requirement: 'required' },
              { label: 'From / Card', what: 'The account the EMI leaves from, or the card it is billed to.', requirement: 'optional' },
              { label: 'In the plan', what: 'Adds the EMI to Months as a bill that follows this loan, so what is free already allows for it.', requirement: 'optional' },
              { label: 'Note', what: 'Anything worth remembering about it.', requirement: 'optional' },
            ],
          },
        ],
      },
      {
        heading: 'How do I fill it?',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Open the Add button and choose Loan (or "Add a loan" from Debts).',
              'Name it and enter the lender.',
              'Fill in whatever you know from the sanction letter - amount, rate, tenure, disbursal date. Leave the rest blank.',
              'Check the figures Kosh has worked out under "Where it stands", and correct any that differ from your latest statement.',
              'Choose the account the EMI leaves from (or the card it is billed to), and whether to add it to the plan as a bill.',
              'Save.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'The loan appears under Debts immediately, and - if you added it to the plan - its EMI shows up in Months from this cycle onward, taken out of what is free before you ever see the figure.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'qa',
            items: [
              {
                question: 'I do not know the interest rate',
                answer:
                  'Leave it blank. Kosh still tracks the EMI and what is left, honestly, as "terms not supplied" - it just will not show a payoff date until you add the rate.',
              },
              {
                question: 'Kosh worked out an EMI that does not match my statement',
                answer:
                  'Type your real EMI in - it is kept as yours, and Kosh will flag if it disagrees with what the amount, rate and tenure alone would suggest, rather than silently using either figure.',
              },
            ],
          },
        ],
      },
    ],
    related: ['loans.understanding-a-loan', 'loans.what-an-emi-is', 'accounts.adding-an-account'],
    seeInApp: [{ label: 'Open Debts', to: '/money/debts' }],
  },
  {
    id: 'loans.how-debts-works',
    category: 'loans',
    slug: 'how-debts-works',
    title: 'How Debts works',
    summary: 'What you’re paying off, what it costs each month, and when you’ll be free of it - nothing here is invented.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Debts is where the product most often declines to show a number - no payoff date, no repaid figure, no interest split - and each refusal has a one-click reason rather than reading as missing data.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Leaving every month', means: 'EMIs debited straight from a bank account.', primer: true },
              { term: 'Billed to a card', means: 'EMIs inside a card bill — never added twice.', primer: true },
              { term: 'Confirmed', means: 'Terms taken from the sanction letter or a statement. Every figure is derived.' },
              { term: 'Estimated', means: 'Worked out from what you entered, not paperwork. Close, not exact.' },
              { term: 'Terms not supplied', means: 'No interest rate yet. The EMI and payments left are known; the payoff date and amount repaid aren’t shown.', primer: true },
              { term: 'Payment unverified', means: 'A payment we couldn’t confirm left. Counted as still owed until you confirm it.' },
            ],
          },
          {
            kind: 'example',
            title: 'Outstanding vs. still to pay, on the bike loan',
            lines: [
              { label: 'Outstanding principal', value: '₹1,77,276' },
              { label: 'EMIs left', value: '37' },
              { label: 'Still to pay (37 × ₹6,145)', value: '₹2,27,365' },
            ],
            note: 'The ₹50,089 difference is interest still to be charged over the remaining EMIs - it stays knowable from the EMI and count alone, even before a loan has confirmed terms.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'qa',
            items: [
              {
                question: 'How do I record an EMI I’ve paid?',
                answer:
                  'As an Expense from the bank account it left, in the Loan EMI category — or Settle it from Months if it’s set up as a bill there. Not as a transfer to the loan.',
              },
              {
                question: 'How do I record paying extra towards a loan?',
                answer: 'As a Transfer from your bank account to the loan account. That’s a prepayment, and it reduces what you owe.',
              },
              {
                question: 'Why isn’t the card EMI added to what leaves every month?',
                answer:
                  'It arrives inside your card bill, and paying the card bill is already how that money leaves. Adding it again would count the same money twice.',
              },
              {
                question: 'Why is there no payoff date?',
                answer:
                  'The loan has no interest rate recorded. A payoff date worked out from a guessed rate would look exact and be wrong, so none is shown. Add the rate from the sanction letter and it appears.',
              },
              {
                question: 'Why isn’t each EMI split into principal and interest?',
                answer:
                  'The split needs the real rate and start date. With them, the loan’s own page shows the full schedule; without them, a made-up split would be worse than none.',
              },
              {
                question: 'What is “Still to pay”?',
                answer:
                  'Every EMI still to come, added up — what will actually leave your hands, which stays knowable even when the terms aren’t. It isn’t the same as the principal outstanding.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Related',
        blocks: [
          {
            kind: 'elsewhere',
            items: [
              { thing: 'When this month’s EMI is due, and whether it’s paid', where: 'Months', to: '/month' },
              { thing: 'The balance of the account an EMI leaves from', where: 'Accounts', to: '/money/accounts' },
              { thing: 'Every EMI payment you’ve recorded', where: 'Ledger', to: '/ledger' },
            ],
          },
        ],
      },
    ],
    related: ['loans.understanding-a-loan', 'loans.what-an-emi-is', 'loans.outstanding-vs-remaining'],
    seeInApp: [{ label: 'Open Debts', to: '/money/debts' }],
  },
];
