import type { DocTopic } from '../types';

/**
 * How figures are worked out - new in Phase B (IN_APP_MANUAL.md §8). This is the
 * category that carries the plain-language version of ADR-0011 (derived values are never
 * stored) and ADR-0006 (never be confidently wrong) - the two rules that most often
 * surprise a new user when a number they expect to be simple turns out to be a chain, or
 * refuses to show at all.
 */
export const CALCULATIONS_TOPICS: DocTopic[] = [
  {
    id: 'calculations.free-until-salary',
    category: 'calculations',
    slug: 'free-until-salary',
    title: 'How "Free until salary" is worked out',
    summary: 'Held, minus reserved, minus every bill still due, minus what is owed on cards - four real figures, added and subtracted, never a single stored number.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Free until salary is not a number kept somewhere and updated when something changes - it is worked out fresh, from your accounts and commitments, every time the page is opened.',
          },
          {
            kind: 'table',
            head: ['Step', 'Where it comes from'],
            rows: [
              ['Held', 'Every bank and cash account marked as spending money, added up.'],
              ['− Reserved', 'Any amount you have set aside for something specific.'],
              ['− Committed', 'Every commitment still due before your next salary, from the plan.'],
              ['− Owed on cards', 'The current outstanding balance on every credit card.'],
            ],
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Because it is recalculated rather than stored, correcting any one of those inputs - an account balance, a bill’s amount, a card’s outstanding balance - is immediately right everywhere the figure appears. There is never a second, cached copy that could disagree with it.',
          },
          {
            kind: 'example',
            title: 'Two days before salary',
            lines: [
              { label: 'Held', value: '₹8,000' },
              { label: '− Reserved', value: '₹0' },
              { label: '− Committed', value: '₹0' },
              { label: '− Owed on cards', value: '₹0' },
              { label: '= Free until salary', value: '₹8,000' },
            ],
            note: 'Two days to go, so ₹4,000 a day. Record a ₹500 expense and Held drops to ₹7,500 - the figure is worked out again, not adjusted.',
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
                question: 'Why does correcting an old entry change today’s figure?',
                answer:
                  'Because nothing is stored - Free until salary is worked out from your accounts as they stand right now, including every correction, however far back it was recorded.',
              },
              {
                question: 'Why does the figure sometimes show "—"?',
                answer: 'See "Why some numbers show a dash" - it means one of these inputs is not yet known, not that something has gone wrong.',
              },
            ],
          },
        ],
      },
    ],
    related: ['today.real-balance', 'calculations.derived-never-stored', 'calculations.why-some-numbers-show-a-dash'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'calculations.net-worth-and-approximate',
    category: 'calculations',
    slug: 'net-worth-and-approximate',
    title: 'How net worth and "Approximate" are worked out',
    summary: 'Every account that counts toward what you own, minus every one that counts toward what you owe - labelled Approximate the moment any one of them is not Confirmed.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Net worth adds every account balance that counts as something you own, and subtracts every one that counts as something you owe. The "Approximate" label is not a separate judgement - it is simply true whenever at least one of those balances was entered as Estimated or Unknown rather than Confirmed.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'This is the same honesty rule applied to a total: a number cannot be more exact than the figures it is built from, so Kosh says so rather than presenting a confident-looking total built on a guess.',
          },
          {
            kind: 'example',
            title: 'Five loans and three accounts',
            lines: [
              { label: 'What you own', value: '₹62,900' },
              { label: '− What you owe', value: '₹3,40,092' },
              { label: '= Net worth', value: '−₹2,77,192' },
            ],
            note: 'Negative is normal while loans are running, and it rises every month you pay them down. One loan balance entered as Estimated is enough for the whole total to read "Approximate".',
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
                question: 'I confirmed every balance, but net worth still says Approximate',
                answer: 'Check every account, including ones you might not think of as "financial" in the everyday sense - a loan or an investment left as Unknown carries the same weight as a bank account.',
              },
              {
                question: 'Does cover (insurance) affect net worth?',
                answer: 'No - cover is never an asset (ADR-0016) and never touches net worth, however much it is for.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.net-worth', 'accounts.adding-an-account'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
  {
    id: 'calculations.why-some-numbers-show-a-dash',
    category: 'calculations',
    slug: 'why-some-numbers-show-a-dash',
    title: 'Why some numbers show "—" instead of a guess',
    summary: 'A dash, or "INCOMPLETE", means a real figure is missing - Kosh refuses to fill the gap with a number it cannot stand behind.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A missing figure in Kosh is always shown as missing - a dash, "needs a number", or a plain state like "INCOMPLETE" - and it is always a normal response (a 200), never treated as an error.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Null means unknown; it never means zero. A total that silently drops an unknown part and shows the rest as if it were complete would read as a fact and be wrong - that is treated as the worst kind of failure this product can have, worse than showing nothing at all.',
          },
          {
            kind: 'table',
            head: ['You see', 'What it means'],
            rows: [
              ['"—" on Free until salary', 'A mandatory bill has no amount yet.'],
              ['No payoff date on a loan', 'The loan has no interest rate recorded.'],
              ['"At most, N bills need an amount" on Flexible', 'One or more bills this month have no figure yet - a ceiling, not the real number.'],
              ['No growth on a holding', 'It has never been valued.'],
            ],
          },
          {
            kind: 'example',
            title: 'An electricity bill with no amount yet',
            lines: [
              { label: 'Comes in', value: '₹57,700' },
              { label: '− Committed', value: '₹41,616' },
              { label: '− Set aside', value: '₹12,500' },
              { label: '= Free this month', value: 'up to ₹3,584' },
            ],
            note: '"Up to", not "₹3,584". Electricity varies and has no figure yet, so what is free can only shrink from here. Enter the amount and the ceiling becomes a number.',
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
                question: 'Can I make Kosh show its best guess instead?',
                answer: 'No, by design. Give the missing figure a real value - even a rough estimate you enter yourself - and the number returns; Kosh will not invent one on your behalf.',
              },
              {
                question: 'Is a dash an error I should report?',
                answer: 'No - it is the product working correctly. It means one input is genuinely unknown, and the fix is to supply that input.',
              },
            ],
          },
        ],
      },
    ],
    related: ['calculations.free-until-salary', 'troubleshooting.numbers-dont-match-my-bank'],
  },
  {
    id: 'calculations.derived-never-stored',
    category: 'calculations',
    slug: 'derived-never-stored',
    title: 'Why nothing is ever stored twice',
    summary: 'Balances, Room, net worth, whether a bill is settled - almost everything is worked out fresh each time, so a correction anywhere is right everywhere, instantly.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Almost every figure Kosh shows you - a balance, Free until salary, Room, net worth, whether a commitment is settled - is computed at the moment you look, from your accounts and entries, rather than kept as a running total updated as things happen.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'The spreadsheet Kosh replaces failed exactly this way, more than once: a stored total drifted from the entries behind it, and nothing forced the two back into agreement. Recomputing instead of storing makes that particular failure impossible - there is nothing to drift out of sync with, because there is only one copy of the truth: your accounts and your entries.',
          },
          {
            kind: 'example',
            title: 'Correcting a ₹500 entry you typed as ₹5,000',
            lines: [
              { label: 'Free until salary, before', value: '₹3,500' },
              { label: 'Fix the entry to', value: '₹500' },
              { label: 'Free until salary, after', value: '₹8,000' },
            ],
            note: 'Nothing else had to be touched. Today, Months, net worth and the account balance all corrected themselves, because none of them was holding its own copy of the figure.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'callout',
            tone: 'note',
            text: 'The one deliberate exception is a closed month: once a cycle is closed, its snapshot is kept as a historical fact rather than recomputed forever after - closing a month is a decision, not a running total.',
          },
          {
            kind: 'qa',
            items: [
              {
                question: 'If I fix an old transaction, does everything update immediately?',
                answer: 'Yes - the next time any figure built from it is read, it reflects the correction. There is no separate step to "recalculate".',
              },
            ],
          },
        ],
      },
    ],
    related: ['calculations.free-until-salary', 'corrections.editing-a-transaction', 'months.closing-a-month'],
  },
];
