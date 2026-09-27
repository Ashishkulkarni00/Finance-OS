import type { DocTopic } from '../types';

/**
 * Editing and correcting mistakes - new in Phase B (IN_APP_MANUAL.md §8). Everything
 * here follows from two rules in `CLAUDE.md`: money is never counted twice, and
 * financial history is never destroyed, only soft-deleted (ADR-0004).
 */
export const CORRECTIONS_TOPICS: DocTopic[] = [
  {
    id: 'corrections.editing-a-transaction',
    category: 'corrections',
    slug: 'editing-a-transaction',
    title: 'Fixing an entry in the Ledger',
    summary: 'Open it from the Ledger and edit it directly - every figure built from it recalculates, nothing carries the old value forward.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A wrong amount, a wrong category, the wrong account - any entry in the Ledger can be opened and corrected directly, the same way it was created.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Because nothing in Kosh stores a total that could disagree with its own entries (Rule 1: derived values are never stored), correcting an entry is always safe. Every balance, every commitment’s settled status, every card statement that touches it recalculates from the corrected figure the next time it is read - there is no stale copy anywhere to also go and fix.',
          },
          {
            kind: 'example',
            title: 'A mistyped amount',
            lines: [
              { label: 'Recorded as', value: '₹50' },
              { label: 'Should be', value: '₹500' },
              { label: 'After editing', value: 'Every total re-reads it instantly' },
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
              'Find the entry in the Ledger.',
              'Open it and change whatever is wrong - the amount, the category, the account, the date.',
              'Save. Free until salary, the account’s balance, and anything else built from it update immediately.',
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
                question: 'I recorded the wrong type - an Expense that should have been a Transfer',
                answer: 'Edit it and change the type. If the accounts involved are different for that type, choose them again as part of the same edit.',
              },
              {
                question: 'Does editing an entry inside a closed month change anything?',
                answer:
                  'The entry itself updates and every live figure recalculates from it. The closed month’s own snapshot stays as it was recorded - a closed cycle is a historical fact, not a running total.',
              },
            ],
          },
        ],
      },
    ],
    related: ['corrections.deleting-and-soft-delete', 'calculations.derived-never-stored'],
    seeInApp: [{ label: 'Open the Ledger', to: '/ledger' }],
  },
  {
    id: 'corrections.editing-a-commitment-or-loan',
    category: 'corrections',
    slug: 'editing-a-commitment-or-loan',
    title: 'Changing a commitment, a loan or a goal',
    summary: 'Editing changes the rule going forward - it is recorded as a change, not a silent rewrite, and past months are not touched.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Rent going up, a loan’s EMI changing after a part-payment, a goal’s target moving - these are all edits to the standing rule, not to any one month’s occurrence of it.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'A change to a commitment or a plan is versioned: what changed, when, and what it now costs a month is kept, rather than the old figure simply vanishing. A silent plan rewrite - where an old commitment quietly becomes a different one - is treated as a defect, never a shortcut.',
          },
          {
            kind: 'example',
            title: 'Rent goes up',
            lines: [
              { label: 'Old rent', value: '₹15,000 a month' },
              { label: 'New rent, from November', value: '₹16,500 a month' },
              { label: 'October', value: 'Still shows ₹15,000 - the change starts in November' },
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
                question: 'I want to change a bill’s amount for one month only',
                answer: 'Use the pencil on that occurrence in Months and set "This time" - only that month changes. Editing the commitment itself changes every future month.',
              },
              {
                question: 'A loan’s EMI changed after a part-payment - do I edit the loan?',
                answer: 'Yes - open the loan and update its terms. Its schedule and payoff date recalculate from the new figures.',
              },
            ],
          },
        ],
      },
    ],
    related: ['monthly-plan.adding-a-commitment', 'loans.adding-a-loan'],
  },
  {
    id: 'corrections.deleting-and-soft-delete',
    category: 'corrections',
    slug: 'deleting-and-soft-delete',
    title: 'Why "delete" never destroys history',
    summary: 'Deleting an account, a commitment or an entry hides it going forward - it is never permanently erased, so a mistake is never unrecoverable.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Financial history is never destroyed in Kosh - "delete" is always a soft delete. An account you archive, a commitment you remove, a category you retire: each stops appearing going forward, but the record behind it is kept.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'This matters for the same reason the source spreadsheet this replaces corrupted itself six times in three days: a genuine mistake - deleting the wrong thing, or realising a "correction" was wrong - should never be a dead end.',
          },
          {
            kind: 'example',
            title: 'Archiving an old wallet',
            lines: [
              { label: 'Account', value: 'Old Cash Wallet' },
              { label: 'Action', value: 'Archived' },
              { label: 'Past months', value: 'Still show its balance and history exactly as recorded' },
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
                question: 'I deleted an account by mistake - is the data gone?',
                answer: 'No, it is archived rather than erased. If you need it restored, that is a support action rather than something you undo yourself in the current version.',
              },
              {
                question: 'Why can’t I permanently delete something myself?',
                answer: 'Because every other figure in Kosh might already depend on it having existed - a settled bill, a past balance. Hiding it going forward is safe; erasing it could quietly change history.',
              },
            ],
          },
        ],
      },
    ],
    related: ['corrections.editing-a-transaction', 'corrections.editing-a-commitment-or-loan'],
  },
  {
    id: 'corrections.fixing-a-wrong-balance',
    category: 'corrections',
    slug: 'fixing-a-wrong-balance',
    title: 'An account balance looks wrong',
    summary: 'Use "Update balance" to re-anchor it to what your bank shows - not a correcting entry, which would double-count whatever already happened.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'When an account’s balance has drifted from what your bank actually shows - a missed entry, a bank charge you never recorded - the fix is "Update balance", not a manually typed correcting transaction.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Update balance re-anchors the account: from the date you give, the balance is your entered figure plus anything recorded strictly after it. A correcting entry, by contrast, risks double-counting whatever caused the drift in the first place.',
          },
          {
            kind: 'example',
            title: 'A ₹120 bank charge, never recorded',
            lines: [
              { label: 'Kosh’s balance', value: '₹19,770' },
              { label: 'Bank’s balance', value: '₹19,650' },
              { label: 'Difference', value: '₹120 - an unrecorded charge' },
            ],
            note: 'Recording that ₹120 charge as an expense closes the gap on its own - Update balance is only needed when the missing entry itself cannot be found.',
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
                question: 'Should I add a transaction to fix a wrong balance instead?',
                answer:
                  'No - use Update balance. A transaction records something that moved; a wrong balance is usually something that was never recorded at all, and Update balance closes that gap without guessing what the missing entry was.',
              },
              {
                question: 'I updated the balance and now a later entry looks wrong',
                answer: 'Check the date you gave Update balance - anything dated on or before it is already folded in, so an entry with that same date will not be counted again.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.updating-a-balance', 'corrections.editing-a-transaction'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
];
