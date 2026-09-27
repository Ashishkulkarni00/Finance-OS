import type { DocTopic } from '../types';

/**
 * Monthly plan - Phase A content, migrated to sections. Field labels from
 * `features/plan/components/CommitmentFields.tsx` and `AddCommitmentSheet.tsx`; settling
 * behaviour from `features/commitments/components/SettleCommitmentSheet.tsx`.
 */
export const MONTHLY_PLAN_TOPICS: DocTopic[] = [
  {
    id: 'monthly-plan.adding-a-commitment',
    category: 'monthly-plan',
    slug: 'adding-a-commitment',
    title: 'Adding a commitment',
    summary: 'A commitment is anything with a known date each month - rent, an EMI, a subscription, family support. Add it once and it shows up every month it applies to.',
    startHereStep: 5,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A commitment is anything that leaves (or arrives) on roughly the same day, over and over: rent, a loan EMI, a SIP, a subscription, family support you send every month. Add each one once, and Kosh generates it in every month it falls due, rather than you re-entering it each time.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'This is what lets Months show you the whole shape of a month before it happens - what is already spoken for, and what is genuinely free - instead of only ever looking backward at what you already spent.',
          },
          {
            kind: 'example',
            title: 'Rent, due on the 5th',
            lines: [
              { label: 'What', value: 'Rent' },
              { label: 'Type', value: 'Payment' },
              { label: 'How much', value: '₹15,000' },
              { label: 'Due on', value: '5th' },
              { label: 'Paid from', value: 'HDFC Salary' },
            ],
            note: 'Saved once, ₹15,000 shows up under "Due date passed" or "Still to come" every month from here on - never re-typed.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: 'The "Add a commitment" form, in the order it asks.',
            items: [
              { label: 'What', what: 'A name you will recognise.', example: 'Rent, Netflix, family support…', requirement: 'required' },
              {
                label: 'Type',
                what: '"Payment" for money that leaves you (rent, EMIs, bills). "Saving" for money moved into your own savings account. "Investing" for a SIP or RD. "Income" for money you expect to receive.',
                requirement: 'required',
              },
              {
                label: 'Same every time?',
                what: '"Yes - it’s the same amount" if it never changes. "No - it changes, like electricity" if it varies month to month.',
                requirement: 'required',
              },
              { label: 'How much', what: 'The fixed amount, if it is the same every time.', requirement: 'required' },
              { label: 'First amount', what: 'For a changing bill, its amount this first time, if you already know it. Leave blank and fill it in later on Months.', requirement: 'optional' },
              {
                label: 'How often',
                what: '"Every month", "Every 3 months", "Every year", or "Just once - it won’t repeat" for a one-off.',
                requirement: 'required',
              },
              { label: 'Due on', what: 'The day of the month it is paid, from 1 to 28.', example: '5', requirement: 'required' },
              {
                label: 'First payment',
                what: 'The month it should first appear in your plan - usually this one, not when you first ever started paying it.',
                requirement: 'required',
              },
              {
                label: 'Last payment',
                what: 'Only if it ends, like a final EMI instalment. Leave blank ("No end") if it keeps going indefinitely.',
                requirement: 'optional',
              },
              {
                label: 'Paid from',
                what: 'The account it leaves from. Only accounts that fit the chosen Type are offered - a credit card cannot pay a transfer, for instance.',
                requirement: 'required',
              },
              {
                label: 'Into',
                what: 'Shown for Saving and Investing - your own account the money moves into.',
                requirement: 'required',
              },
              { label: 'Category', what: 'Groups it with similar spending. Not shown for Saving or Investing.', requirement: 'optional' },
              {
                label: 'Must pay?',
                what: '"Yes - missing it costs me" (a fee, a penalty) or "No - I could skip it in a tight month". This decides whether it is counted in Free until salary as unavoidable.',
                requirement: 'required',
              },
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
              'Open the Add button (or "Add a commitment" from Months) and name it.',
              'Choose its Type - this decides which accounts and category it can use.',
              'Say whether the amount is the same every time, and enter it if so.',
              'Set how often it falls due, the day it is due, and which month it should first appear in.',
              'Choose the account it is paid from (and, for Saving or Investing, where it goes).',
              'Save. Kosh tells you which month it landed in, based on the due date you gave.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'After saving, the commitment appears in every month it applies to, generated automatically from the rule you set up - you never add "October’s rent" separately from "November’s rent". If its due date this cycle has already passed, it still counts, listed under "Due date passed" until you settle it.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Everything downstream reads from this: Months’ Committed figure, Today’s Free until salary, and what Kosh warns you about all come from the commitments you have set up here.',
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
                question: 'Its amount is different just this once',
                answer:
                  'For a bill that changes each month, click the pencil on its row in Months and set "This time" - only that occurrence changes. To change it for every future month, edit the commitment’s own amount instead.',
              },
              {
                question: 'I added a bill after its due date had already passed',
                answer:
                  'It still counts that month, listed under "Due date passed". If you already paid it and the payment is in your Ledger, settle it and choose "Already in the Ledger" - do not record the payment again, or it is counted twice.',
              },
              {
                question: 'Why is there no field for "if I skip this, what happens"?',
                answer:
                  '"Must pay?" already carries the part that changes behaviour - whether skipping it costs you something. A free-text note for that tended to just restate the bill’s own name.',
              },
            ],
          },
        ],
      },
    ],
    related: ['monthly-plan.settling-a-bill', 'months.the-month-line', 'income.adding-your-salary'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
  {
    id: 'monthly-plan.settling-a-bill',
    category: 'monthly-plan',
    slug: 'settling-a-bill',
    title: 'Settling a bill',
    summary: 'Settle marks a commitment as paid and records the payment in your Ledger in the same action - never a second, separate entry.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'When a bill or EMI is actually paid, you settle it. Settling does two things at once: it records the payment as a transaction in your Ledger, and it marks that month’s occurrence as paid - so it stops being counted as still owed.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'For expected income, the same action is worded as "Received" - it records the money arriving and replaces the estimate with what actually came in.',
          },
          {
            kind: 'prose',
            text: 'There are two ways to settle, because there are two real situations: a payment that has not been recorded anywhere yet, and one that is already sitting in your Ledger because you recorded it before adding the bill.',
          },
          {
            kind: 'example',
            title: 'Settling the bike EMI',
            lines: [
              { label: 'Amount', value: '₹6,145' },
              { label: 'From', value: 'HDFC Salary' },
              { label: 'Date', value: '5 Oct' },
            ],
            note: 'The EMI now shows as paid on Months, and its ₹6,145 was already taken out of Free until salary as Committed - so the figure does not drop again when it is settled.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: 'The Settle sheet, "Record a new payment" tab.',
            items: [
              { label: 'Amount', what: 'Defaults to what is still owed on this occurrence - change it if you paid a different amount.', requirement: 'auto' },
              { label: 'Category', what: 'Shown for a payment or income; defaults to the commitment’s own category.', requirement: 'auto' },
              { label: 'From / Into', what: 'The account the money left from, or arrived into.', requirement: 'auto' },
              { label: 'Date', what: 'When it actually happened. Cannot be in the future.', requirement: 'required' },
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
              'Open Settle on the bill’s row, from Today, Months, or the bill’s own page.',
              'If you have not recorded the payment anywhere yet, stay on "Record a new payment", check the amount and date, and save.',
              'If the payment is already in your Ledger - because you recorded it before this bill existed in Kosh - switch to "Already in the Ledger" and pick the matching entry instead.',
              'Once settled, the bill’s status updates everywhere it is shown, and Free until salary reflects it immediately.',
            ],
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'callout',
            tone: 'warn',
            text: 'Never record a payment a second time to "settle" a bill that is already in your Ledger - that counts the same money twice. Use "Already in the Ledger" and link the existing entry instead.',
          },
          {
            kind: 'qa',
            items: [
              {
                question: '"₹350 more than planned"',
                answer: 'It was settled for more than expected. This is just information about what happened, never a warning.',
              },
              {
                question: 'A bill says "not yet confirmed"',
                answer: 'You marked it to double-check against the bank. Once it shows on your statement, press Confirm.',
              },
            ],
          },
        ],
      },
    ],
    related: ['monthly-plan.adding-a-commitment', 'spending.recording-an-expense', 'months.plan-rows-and-statuses'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
];
