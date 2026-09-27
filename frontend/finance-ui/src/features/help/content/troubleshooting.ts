import type { DocTopic } from '../types';

/**
 * Troubleshooting - new in Phase B (IN_APP_MANUAL.md §8). Ordered by what to check
 * first, not alphabetically - each topic ends by pointing at the fix, never just the
 * diagnosis.
 */
export const TROUBLESHOOTING_TOPICS: DocTopic[] = [
  {
    id: 'troubleshooting.numbers-dont-match-my-bank',
    category: 'troubleshooting',
    slug: 'numbers-dont-match-my-bank',
    title: 'A balance does not match my bank',
    summary: 'Check for a missing entry first, then use "Update balance" to re-anchor the account - never a correcting transaction.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Kosh’s balance for an account is your opening figure plus every entry recorded against it since. If your bank shows something different, one of those entries is missing, wrong, or the opening figure itself was off.',
          },
          {
            kind: 'example',
            title: 'A ₹236 bank charge you never recorded',
            lines: [
              { label: 'Kosh shows', value: '₹8,236' },
              { label: 'Your bank shows', value: '₹8,000' },
              { label: 'Difference', value: '₹236' },
            ],
            note: 'Search the Ledger for that exact figure first. A clean, round difference is usually one missing entry; an odd one like this is usually a charge or interest the bank applied on its own.',
          },
        ],
      },
      {
        heading: 'How do I fill it?',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Open the account in the Ledger and check recent entries against your bank statement for the same period.',
              'If something is missing (a bank charge, an interest credit), record it as a transaction with its real date.',
              'If something is recorded wrong, edit that entry directly rather than adding a correction.',
              'If you still cannot find the difference, use "Update balance" to set the account to what your bank shows right now, as of today.',
            ],
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
                question: 'Should I just use Update balance straight away?',
                answer:
                  'It works, but it hides the reason for the gap. Checking for a missing entry first means you will not hit the same drift again next month.',
              },
              {
                question: 'I used Update balance, but the account still looks wrong afterwards',
                answer:
                  'Check whether you added an entry dated on or before the date you gave Update balance - anything up to and including that date is already folded into the figure, so it will not be counted again.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.updating-a-balance', 'corrections.fixing-a-wrong-balance', 'corrections.editing-a-transaction'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
  {
    id: 'troubleshooting.a-bill-or-loan-looks-wrong',
    category: 'troubleshooting',
    slug: 'a-bill-or-loan-looks-wrong',
    title: 'A bill or a loan looks wrong',
    summary: 'Check whether a payment was actually settled, then check the loan’s own terms - most "wrong" figures trace back to one of those two.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A bill that still shows as due after you paid it, or a loan’s outstanding balance that looks too high, almost always comes down to one of two things: a payment that was never recorded, or loan terms that are missing or estimated.',
          },
          {
            kind: 'example',
            title: 'A bike loan that looks stuck',
            lines: [
              { label: 'Kosh says outstanding', value: '₹1,77,276' },
              { label: 'Your lender says', value: '₹1,71,131' },
              { label: 'Difference', value: '₹6,145' },
            ],
            note: 'Exactly one EMI. The loan’s balance moves when a payment is recorded, not when the due date passes, so an unrecorded EMI leaves it describing last month. Debts flags this rather than assuming it was paid.',
          },
        ],
      },
      {
        heading: 'How do I fill it?',
        blocks: [
          {
            kind: 'steps',
            items: [
              'For a bill: check whether the payment is in the Ledger. If it is not, Settle the bill. If it is, but was recorded before the bill existed in Kosh, Settle it and choose "Already in the Ledger" to link the two.',
              'For a loan: a loan’s balance only moves when a payment is recorded against it, never automatically on the due date - check the EMI has actually been recorded as an Expense (or settled from Months).',
              'If a loan’s payoff date or repaid figure is missing, add its interest rate from the sanction letter - without it, Kosh will not show a figure it cannot stand behind.',
            ],
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
                question: 'I recorded the EMI, but the loan’s outstanding balance did not change',
                answer:
                  'Check the EMI was recorded as an Expense in the Loan EMI category, or settled as the loan’s bill - not as a Transfer, and not against the wrong account.',
              },
              {
                question: 'A card EMI is missing from what leaves every month',
                answer:
                  'That is expected - it arrives inside the card’s own bill, and is not added again separately, which would count it twice.',
              },
            ],
          },
        ],
      },
    ],
    related: ['monthly-plan.settling-a-bill', 'loans.understanding-a-loan', 'loans.adding-a-loan'],
  },
  {
    id: 'troubleshooting.recorded-something-twice',
    category: 'troubleshooting',
    slug: 'recorded-something-twice',
    title: 'I think I recorded something twice',
    summary: 'The two classic double-counts are a card swipe recorded again at bill time, and a cash withdrawal recorded again as a spend - check the Ledger for both entries.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Almost every accidental double-count in Kosh has the same shape: the same money recorded once as an Expense and again as a second Expense or Transfer for the same thing.',
          },
          {
            kind: 'example',
            title: 'A ₹6,375 card bill counted twice',
            lines: [
              { label: 'Swipes recorded as expenses', value: '₹6,375' },
              { label: 'Bill payment recorded as an expense', value: '₹6,375' },
              { label: 'Kosh thinks you spent', value: '₹12,750' },
            ],
            note: 'The purchases were the spending. Paying the bill just moves money from your bank to the card, so it is a Transfer - change the second entry and the double count goes.',
          },
        ],
      },
      {
        heading: 'How do I fill it?',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Open the Ledger and search around the date in question.',
              'Look for a credit card purchase recorded as an Expense, and its bill payment also recorded as an Expense rather than a Transfer - delete or edit the second one.',
              'Look for an ATM withdrawal recorded as an Expense instead of a Transfer to Cash, with the actual spending of that cash recorded separately as well - keep only the real spend.',
              'Look for a bill Settled a second time when the payment was already sitting in the Ledger - use "Already in the Ledger" instead, and remove the duplicate.',
            ],
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
                question: 'How do I tell which of the two entries to remove?',
                answer: 'Keep the one that matches when the money actually moved - the swipe, or the withdrawal - and remove the one that was really just settling it.',
              },
              {
                question: 'Will deleting the duplicate affect anything else?',
                answer: 'No - every figure recalculates from what remains. There is nothing else to fix once the duplicate is gone.',
              },
            ],
          },
        ],
      },
    ],
    related: ['spending.card-purchases-vs-paying-the-bill', 'corrections.editing-a-transaction'],
    seeInApp: [{ label: 'Open the Ledger', to: '/ledger' }],
  },
  {
    id: 'troubleshooting.the-app-shows-a-dash',
    category: 'troubleshooting',
    slug: 'the-app-shows-a-dash',
    title: 'A figure shows "—" or "INCOMPLETE"',
    summary: 'This is not an error - it means one real input is missing. Find which one, supply it, and the figure returns.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A dash, or a status like "INCOMPLETE", is Kosh telling you plainly that it does not have everything it needs to give you an honest number - never a bug, and never worth reporting as one on its own.',
          },
          {
            kind: 'example',
            title: 'What the dash is waiting for',
            lines: [
              { label: 'Free until salary', value: '—' },
              { label: 'Because', value: 'Electricity has no amount' },
              { label: 'Enter even a rough', value: '₹1,200' },
              { label: 'Free until salary', value: '₹6,800' },
            ],
            note: 'A rough figure you can correct later is worth far more than a blank. Kosh would rather show nothing than a total quietly missing one of its parts.',
          },
        ],
      },
      {
        heading: 'How do I fill it?',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Read the line beside the dash - Kosh names what is missing, such as a bill with no amount, or a loan with no interest rate.',
              'Supply that figure - even a rough estimate for a changing bill is enough to bring "Free until salary" back.',
              'If nothing beside it says what is missing, check the topic for that screen in this manual - "How figures are worked out" covers the most common cases.',
            ],
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
                question: 'I gave every figure I can think of and it still shows "—"',
                answer:
                  'Check for a second bill in the same month with an unknown amount - the figure stays incomplete until every mandatory bill has one, not just the first you find.',
              },
            ],
          },
        ],
      },
    ],
    related: ['calculations.why-some-numbers-show-a-dash', 'calculations.free-until-salary'],
  },
];
