import type { DocTopic } from '../types';

/**
 * Monthly overview (Phase A shipped one seed topic here, `months.the-month-line`, only so
 * the required `month.shape` anchor resolved to something real - see the file's original
 * header note, now superseded). Phase B promotes it into the full category
 * IN_APP_MANUAL.md §8 calls "Monthly overview", plus the `months.how-months-works` hub
 * topic `MonthGuideSheet`/`MonthPrimer` render from after the retrofit.
 *
 * Source: `features/month/components/MonthShape.tsx`, `PlanZone.tsx`, `WorklistRow.tsx`
 * and `routes/MonthClosePage.tsx`.
 */
export const MONTHS_TOPICS: DocTopic[] = [
  {
    id: 'months.the-month-line',
    category: 'months',
    slug: 'the-month-line',
    title: 'The month in one line',
    summary: 'What comes in, what is already spoken for, what is set aside, and what that leaves for everything else - one line, at the top of Months.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'At the top of Months, one line of figures gives you the shape of the whole salary cycle before you read anything else: what is expected in, what is already committed, what you have chosen to set aside, and what is left over for everything flexible.',
          },
          {
            kind: 'table',
            head: ['', 'Meaning'],
            rows: [
              ['Comes in', 'Your expected income this month - salary and anything else expected, whether or not it has arrived yet.'],
              ['− Committed', 'Bills, EMIs and card payments due this month.'],
              ['− Set aside', 'Savings and investments planned this month.'],
              ['= Flexible', 'What is left for everything else this month - day-to-day spending.'],
            ],
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A month with salary on the 28th',
            lines: [
              { label: 'Comes in', value: '₹57,700' },
              { label: '− Committed', value: '₹38,900' },
              { label: '− Set aside', value: '₹5,500' },
              { label: '= Flexible', value: '₹13,300' },
            ],
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Underneath, a bar shows how much of Flexible has been spent so far against how much of the month has actually gone by - a pace, stated plainly, never as a verdict. Spending ahead of the month’s pace is just information, not a warning that you have done something wrong.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'callout',
            tone: 'note',
            text: 'If Flexible shows "at most" with a number of bills needing an amount, it is a ceiling, not the real figure yet - one or more bills this month have no amount recorded. Give them one to see the real number.',
          },
        ],
      },
    ],
    related: ['monthly-plan.adding-a-commitment', 'today.room', 'months.day-to-day-spending'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
  {
    id: 'months.plan-rows-and-statuses',
    category: 'months',
    slug: 'plan-rows-and-statuses',
    title: 'Reading a row in the plan',
    summary: 'Every bill this cycle sits in the plan with one of a small set of statuses - and the action beside it always matches what the row needs.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: '"The plan" lists every commitment in this cycle, not only the ones still ahead - a settled bill stays visible with what it cost, so the month reads as complete rather than as a shrinking to-do list. Grouped by date by default (one band per due date), or by category.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'terms',
            items: [
              { term: 'Due date passed', means: 'Unsettled, and its date has gone by - including a bill you added after its due date, which is exactly the case people forget to record.' },
              { term: 'Amount unknown', means: 'A changing bill with no figure yet. It shows "Estimate" instead of Settle, and Free until salary can only show "at most" until it has one.' },
              { term: 'Skipped', means: 'Marked as not happening this month, so it stops counting against what is free. Reversible with Undo, as long as it has not been settled.' },
              { term: 'Settled', means: 'Paid, and recorded as a transaction. Shows what it actually cost against what was planned.' },
            ],
          },
          {
            kind: 'example',
            title: 'Electricity, amount unknown',
            lines: [
              { label: 'Status', value: 'Amount unknown' },
              { label: 'Action offered', value: 'Estimate' },
              { label: 'You enter', value: '₹1,800' },
              { label: 'Now shows', value: 'Estimated, not yet settled' },
            ],
            note: 'Free until salary can only say "at most" until this row has a number - entering ₹1,800 turns the ceiling into the real figure.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'The action on a row always matches its state: "Estimate" for a bill with no amount, "Skip" for an optional bill you will not pay this month, "Settle" (or "Record it" for a saving or investment, "Received" for income) once there is a real figure to record against it. A settled row loses the action and shows what it actually cost instead.',
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
                question: 'I skipped a bill by mistake',
                answer: 'Press Undo on its row - it is only offered as long as the bill has not since been settled.',
              },
              {
                question: 'Can I skip a mandatory bill?',
                answer: 'No - Skip only appears on a bill marked "No - I could skip it in a tight month" when adding it, and only before it has any confirmed amount.',
              },
              {
                question: '"₹350 more than planned"',
                answer: 'It was settled for more than expected - and for income, "than expected" rather than "than planned". Both are just information, never a warning.',
              },
            ],
          },
        ],
      },
    ],
    related: ['monthly-plan.settling-a-bill', 'months.the-month-line'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
  {
    id: 'months.day-to-day-spending',
    category: 'months',
    slug: 'day-to-day-spending',
    title: 'Flexible spending and its pace',
    summary: 'What is left over this month for everything that is not a bill, and how much of it has already gone against how much of the month has.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Flexible is what remains once income, committed bills and what you have set aside for savings and investments are all accounted for. It is the money day-to-day spending - groceries, transport, eating out - actually comes out of.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'A bar under the month line shows how much of Flexible has been spent so far against how far through the month you are - two independent fractions, drawn together so you can see at a glance whether spending is ahead of, or behind, the month’s own pace.',
          },
          {
            kind: 'example',
            title: 'Day 14 of a 30-day month',
            lines: [
              { label: 'Flexible', value: '₹13,300' },
              { label: 'Spent so far', value: '₹6,251 · 47%' },
              { label: 'Month elapsed', value: '14 of 30 days · 47%' },
            ],
            note: 'Spending exactly matches the month’s own pace here - neither ahead nor behind, and Kosh states that plainly rather than as a verdict.',
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
                question: 'The bar shows I have spent more than the month has gone - is that bad?',
                answer:
                  'It is stated, never judged - Kosh never says "over budget". Spending ahead of the month’s pace just means less is left for the rest of it; nothing is flagged as a mistake.',
              },
              {
                question: 'Why is Flexible negative?',
                answer: 'Bills and savings planned this month add up to more than what is expected to come in. It is shown plainly rather than clipped to zero.',
              },
            ],
          },
        ],
      },
    ],
    related: ['months.the-month-line', 'today.room', 'spending.categories-explained'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
  {
    id: 'months.closing-a-month',
    category: 'months',
    slug: 'closing-a-month',
    title: 'Closing a month',
    summary: 'A five-step check once a cycle has ended - confirm balances, resolve what is left open, review the month, see what moved, then close it.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Once a cycle’s end date has passed, "Close month" walks through it before turning it into history: confirming balances, resolving anything still open, reviewing the month against its plan, seeing what changed, and finally closing it.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'A closed cycle is the one place Kosh deliberately keeps a stored figure rather than a derived one - a closed month is a historical fact, not something that should silently change if you correct an entry inside it later.',
          },
          {
            kind: 'example',
            title: 'Closing September',
            lines: [
              { label: 'Cycle', value: '28 Aug – 27 Sep' },
              { label: 'Ended', value: '27 Sep' },
              { label: 'Closed on', value: '28 Sep' },
              { label: 'Kept', value: '11 of 12 commitments' },
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
              'Confirm balances - check your accounts still match what Kosh has for them.',
              'Resolve - settle or skip anything in this cycle still left open.',
              'Review - the month against its own plan.',
              'What moved - what changed since the month began.',
              'Close - turns the cycle into a permanent record.',
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
                question: 'Can I close a month before it has ended?',
                answer: 'No - closing is only offered once the cycle’s end date has passed.',
              },
              {
                question: 'I closed a month by mistake - can I reopen it?',
                answer: 'A closed cycle is kept as a historical fact rather than a number that can drift. If something in it needs correcting, correct the entry itself in the Ledger - every figure recalculates from real entries regardless of a cycle being closed.',
              },
            ],
          },
        ],
      },
    ],
    related: ['months.the-month-line', 'corrections.deleting-and-soft-delete'],
    seeInApp: [{ label: 'Close a month', to: '/month/close' }],
  },
  {
    id: 'months.how-months-works',
    category: 'months',
    slug: 'how-months-works',
    title: 'How Months works',
    summary: 'One month at a time, from one salary to the next: what still has to be paid before your next salary, and how much is free after that.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Months shows one month at a time, from one salary to the next. Everything you pay (or receive) regularly is a commitment - add each one once, and it appears in every month it falls due.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Commitment', means: 'Anything with a known date each month (or just once): rent, an EMI, a SIP, a bill, family support - and your salary coming in.' },
              { term: 'Free until salary', means: 'What’s left in your accounts after every commitment still due before your next salary.', primer: true },
              { term: 'Settle', means: 'Mark one as paid. It records the payment in your Ledger. For income it’s “Received”.', primer: true },
              { term: 'Amount unknown', means: 'One that changes each month, like electricity, with no number yet. Until it has one, “Free until salary” shows “—” rather than a guess.' },
              { term: 'Estimate', means: 'Give an “amount unknown” one a rough number. Nothing is marked paid.', primer: true },
            ],
          },
          {
            kind: 'example',
            title: 'A month with a bonus',
            lines: [
              { label: 'Comes in', value: '₹64,200 (salary + bonus)' },
              { label: '− Committed', value: '₹38,900' },
              { label: '− Set aside', value: '₹5,500' },
              { label: '= Flexible', value: '₹19,800' },
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
                question: 'Why does a month run 28 Sep to 27 Oct?',
                answer:
                  'Months here run from one salary to the next, not 1st to 31st - so a month is exactly the money one salary has to cover. It’s named for the month it ends in.',
              },
              {
                question: 'Can I plan next month?',
                answer:
                  'Yes. Use the arrow beside the month name to move ahead, then add a commitment - its first payment is set to the month you’re looking at.',
              },
              {
                question: 'I added one after its due date had passed',
                answer:
                  'It still counts this month, under “Due date passed”. If you already paid it and the payment is in your Ledger, Settle it and choose “Already in the Ledger” - don’t record it again, or it’s counted twice.',
              },
              {
                question: 'Its amount is different just this once',
                answer:
                  'For one that changes each month, click the pencil and set “This time” - only that month changes. To change it for every month, edit its Amount instead.',
              },
              {
                question: '“₹350 more than planned”',
                answer: 'It was settled for more than expected. Just information, not a warning.',
              },
              {
                question: 'Why is there no budget?',
                answer:
                  'A number picked on a good day is easy to miss and then give up on. After a few months, your spending is compared with your own usual instead.',
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
              { thing: 'What you can spend today', where: 'Today', to: '/today' },
              { thing: 'Every payment behind these totals', where: 'Ledger', to: '/ledger' },
              { thing: 'Account balances', where: 'Accounts', to: '/money/accounts' },
              { thing: 'Loans and what’s left on them', where: 'Debts', to: '/money/debts' },
            ],
          },
        ],
      },
    ],
    related: ['months.the-month-line', 'monthly-plan.adding-a-commitment', 'monthly-plan.settling-a-bill'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
];
