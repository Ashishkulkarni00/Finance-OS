import type { DocTopic } from '../types';

/**
 * Alerts & overdue (Phase A shipped one seed topic here, `attention.what-needs-you`, only
 * so the required `insight.item` anchor resolved to something real - see the file's
 * original header note, now superseded). Phase B promotes it into the full category
 * IN_APP_MANUAL.md §8 calls "Alerts & overdue". Source: `components/InsightList.tsx`.
 */
export const ATTENTION_TOPICS: DocTopic[] = [
  {
    id: 'attention.what-needs-you',
    category: 'attention',
    slug: 'what-needs-you',
    title: '"Needs you"',
    summary: 'A ranked list of the things worth acting on right now - never everything that could theoretically be wrong.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: '"Needs you" is Kosh’s ranked list of what is actually worth your attention: an overdue bill, an account that has gone below zero, a card payment coming due soon. It appears on Today and on Months, and it is deliberately short - the point is to say what matters, not to list everything that could conceivably be checked.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Each item explains itself in plain language and, where there is one, offers the exact action that resolves it - settling a bill, confirming a payment, moving money - so acting on it never means leaving the page to go and figure out what to do.',
          },
          {
            kind: 'example',
            title: 'Three things worth acting on',
            lines: [
              { label: 'Electricity bill', value: '3 days overdue · Settle' },
              { label: 'HDFC Millennia', value: 'Payment due in 2 days · Pay bill' },
              { label: 'Cash', value: '₹450 below zero · Transfer' },
            ],
            note: 'Each has one action attached, so acting on it never means leaving the page to figure out what to do first.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'When the list is empty, Kosh says so plainly - "Nothing needs you right now" - rather than leaving a blank space that reads as if it might just not have loaded. Underneath, "what moved" can also show a line or two worth knowing even when nothing is urgent - a quietly good week is still worth a mention.',
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
                question: 'I dealt with something outside Kosh - can I dismiss an item?',
                answer: 'Yes, on the dedicated "Needs you" list, "I know" quietly dismisses an item without recording anything against it.',
              },
              {
                question: 'Why does Kosh never say "you overspent"?',
                answer: 'Kosh never judges a figure - it states what happened and leaves the conclusion to you. A warning is phrased as a fact, never as criticism.',
              },
            ],
          },
        ],
      },
    ],
    related: ['today.the-today-screen', 'monthly-plan.settling-a-bill', 'attention.overdue-and-what-to-do'],
    seeInApp: [{ label: 'See everything that needs you', to: '/needs-you' }],
  },
  {
    id: 'attention.overdue-and-what-to-do',
    category: 'attention',
    slug: 'overdue-and-what-to-do',
    title: 'A bill or a bank account is overdue or short',
    summary: 'What "overdue" and "already short" actually mean, and the one action each one is asking for.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Two of the most common items in "Needs you" are a bill whose due date has passed without being settled, and a bank account whose balance has gone below zero.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Due date passed', means: 'The bill’s date has gone by unsettled - it still counts against what is free, whether or not you have actually paid it.' },
              { term: 'Already short', means: 'The account holds less than zero - usually an overdraft, or a loan added by mistake as a bank account.' },
            ],
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Neither is a penalty from Kosh - both are facts about your accounts and bills, stated so you can act on them before they compound. A bill counts as due whether or not it is paid; an account being short can make anything else that debits it bounce.',
          },
          {
            kind: 'example',
            title: 'An overdue bill and a short account, side by side',
            lines: [
              { label: 'Electricity (due 5 days ago)', value: 'Still counted against Free until salary' },
              { label: 'Cash', value: '−₹450, likely an overdraft' },
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
                question: 'I already paid an overdue bill - why does it still show as needing me?',
                answer: 'Settle it - marking it paid outside Kosh does not change anything here until the payment is recorded.',
              },
              {
                question: 'An account is short but I know it is really a loan',
                answer: 'It was probably added as a bank account by mistake. Delete it and add it again under Debts, where a negative balance is expected rather than flagged.',
              },
            ],
          },
        ],
      },
    ],
    related: ['attention.what-needs-you', 'monthly-plan.settling-a-bill', 'accounts.balance-vs-available'],
    seeInApp: [{ label: 'See everything that needs you', to: '/needs-you' }],
  },
  {
    id: 'attention.dismissing-and-whats-moved',
    category: 'attention',
    slug: 'dismissing-and-whats-moved',
    title: 'Dismissing an item, and "what moved"',
    summary: '"I know" clears an item without recording anything against it - and "what moved" is the quiet good news underneath, shown even in a clean week.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'On the dedicated "Needs you" page, every item carries a quiet "I know" beside its action - for something you have already handled outside Kosh, or decided to leave. Underneath the list, "what moved" can show a line or two worth knowing even when nothing is urgent.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: '"I know" is deliberately not offered on Today or Months’ in-page lists - a stray tap next to Room should never dismiss a warning by accident. It is only ever a click away on the dedicated page, where reading the list is the whole job.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'example',
            title: 'A clean week',
            lines: [
              { label: 'Needs you', value: 'Nothing right now' },
              { label: 'What moved', value: 'Salary arrived on time · Card bill paid in full' },
            ],
            note: 'A week with nothing urgent and two things worth knowing is still a good week - the server only shows this when nothing urgent is competing for the same attention.',
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
                question: 'I dismissed something by mistake - did it undo anything?',
                answer: 'No - "I know" only hides that item from the list, it never records or changes anything. If the same issue is still true next time the list is worked out, it will be raised again.',
              },
              {
                question: 'Why show good news at all - isn’t "Needs you" just for problems?',
                answer: 'A week where nothing needs you is not the same as a week where nothing happened. "What moved" is the difference between a quiet screen and a screen that has actually checked.',
              },
            ],
          },
        ],
      },
    ],
    related: ['attention.what-needs-you'],
    seeInApp: [{ label: 'See everything that needs you', to: '/needs-you' }],
  },
  {
    id: 'attention.card-and-loan-alerts',
    category: 'attention',
    slug: 'card-and-loan-alerts',
    title: 'Card and loan alerts',
    summary: 'A card bill coming due, and an EMI Kosh could not confirm left - two alerts that point straight at the fix.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Two of "Needs you"’s regular items come from cards and loans: a card’s bill coming due soon, with Pay bill as its action, and an EMI Kosh could not confirm actually left your account, with Confirm as its action.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A card bill due in 2 days',
            lines: [
              { label: 'Card', value: 'HDFC Millennia' },
              { label: 'Amount due', value: '₹8,450' },
              { label: 'Action', value: 'Pay bill (Transfer)' },
            ],
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Neither alert guesses on your behalf: a card bill is flagged from its own due date, not assumed paid, and an EMI stays "unverified" until you confirm it actually left - the same discipline "A loan’s balance moves only when a payment is recorded" applies everywhere else in Kosh.',
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
                question: 'The alert says an EMI wasn’t confirmed - but I definitely paid it',
                answer: 'Check your bank statement for the debit, then press Confirm. Kosh will not assume it went through without that check, because an assumed payment that never happened is worse than a flagged one.',
              },
              {
                question: 'Why an alert instead of marking the EMI paid automatically on its due date?',
                answer: 'Because a due date is a plan, not a fact - see "A loan’s balance moves only when a payment is recorded, not on the due date" in Reading a loan row.',
              },
            ],
          },
        ],
      },
    ],
    related: ['attention.what-needs-you', 'cards.statements-and-paying', 'loans.understanding-a-loan'],
    seeInApp: [{ label: 'See everything that needs you', to: '/needs-you' }],
  },
];
