import type { DocTopic } from '../types';

/**
 * Income - Phase A content, migrated to sections. There is no separate "income" feature
 * in the product: your salary (and any other income you expect) is added the same way as
 * a bill, as a commitment with Type set to Income. Field labels here are taken from
 * `features/plan/components/CommitmentFields.tsx` and `AddCommitmentSheet.tsx`.
 */
export const INCOME_TOPICS: DocTopic[] = [
  {
    id: 'income.adding-your-salary',
    category: 'income',
    slug: 'adding-your-salary',
    title: 'Adding your salary',
    summary: 'Your salary is added as expected income, the same way a bill is added as a commitment - once, and it repeats every month.',
    startHereStep: 4,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Kosh needs to know your salary for two reasons: it is what starts each financial month (see "Why your month runs salary to salary"), and it is what Months plans your bills against before it actually lands.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Add it once, as expected income, and it appears in every month from then on - you never re-enter it.',
          },
          {
            kind: 'example',
            title: 'A fixed salary, on the 28th',
            lines: [
              { label: 'What', value: 'Salary' },
              { label: 'How much', value: '₹57,700' },
              { label: 'Arrives on', value: '28th' },
              { label: 'Arrives in', value: 'HDFC Salary' },
            ],
            note: 'From the next cycle onward, Months counts ₹57,700 as "Comes in" the moment the cycle opens - before the 28th arrives, not after.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: 'The same "Add a commitment" form, with Type set to Income - it then asks a few things differently.',
            items: [
              { label: 'What', what: 'A name for it - "Salary" is enough.', example: 'Salary, Freelance income…', requirement: 'required' },
              { label: 'Type', what: '"Income - salary or money coming in".', requirement: 'required' },
              {
                label: 'Same every time?',
                what: '"Yes" if your salary is a fixed amount. "No - it changes" if it varies, like a freelance payment.',
                requirement: 'required',
              },
              { label: 'How much', what: 'The expected amount, if it is fixed.', example: '57700', requirement: 'required' },
              { label: 'How often', what: 'Almost always "Every month".', requirement: 'required' },
              { label: 'Arrives on', what: 'The day of the month it lands - the day your financial month starts.', example: '28', requirement: 'required' },
              { label: 'First one', what: 'The month it should first appear in your plan - usually this one.', requirement: 'required' },
              { label: 'Last one', what: 'Leave blank unless you know it will stop, like a contract ending.', requirement: 'optional' },
              { label: 'Arrives in', what: 'The account it lands in.', requirement: 'required' },
              { label: 'Category', what: 'An income category, so it groups sensibly with any other income you record.', requirement: 'optional' },
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
              'Open the Add button and choose Income (or start from Months, where adding income is offered directly).',
              'Name it, say whether the amount is fixed, and enter it if so.',
              'Set the day it arrives and the account it lands in.',
              'Save. It now appears in every month’s plan from the one you chose onward.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'After saving, Months counts it toward that month’s standing straight away - as expected, not as money you can spend yet. Nothing changes in what you can actually spend today until the salary is recorded as received.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'This is what lets Kosh plan a whole month’s bills against a salary that has not arrived yet, without ever pretending the money is already in hand.',
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
                question: 'My salary date moves around slightly each month',
                answer:
                  'Pick the day it most often lands on. A payment a day or two off its expected date is still matched to it when you record it as received.',
              },
              {
                question: 'I get more than one income - salary and freelance work',
                answer: 'Add each as its own income commitment. Months adds them together for "Comes in".',
              },
            ],
          },
        ],
      },
    ],
    related: ['income.expected-vs-received', 'getting-started.the-financial-month', 'monthly-plan.adding-a-commitment'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
  {
    id: 'income.expected-vs-received',
    category: 'income',
    slug: 'expected-vs-received',
    title: 'Expected income vs. money that has arrived',
    summary: 'Your salary counts toward the month’s plan the moment you add it - but never toward what you can spend until it is actually recorded as received.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Kosh deliberately keeps these apart. Expected income lets Months show you a full picture of the month ahead - what comes in, what is committed, what is left - before payday. But Free until salary and Room, the numbers that say what you can spend right now, never include a salary that has not landed yet.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'This is the same discipline Kosh applies everywhere: a number that has not happened is shown as a plan, never folded into a number that claims to be real money in hand.',
          },
          {
            kind: 'example',
            title: 'The day before, and the day of, payday',
            lines: [
              { label: '27 Sep - expected', value: 'Counted in Months, not in Free until salary' },
              { label: '28 Sep - received', value: '₹57,700 now counted in Free until salary too' },
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
              'When your salary lands, record it as you would any income - through the Add button, or by settling the expected income entry on Months.',
              'Once recorded, the real amount replaces the expected one for that month, and it now counts toward what you can spend.',
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
                question: 'Why does Free until salary not go up the day before payday?',
                answer:
                  'Because the salary has not arrived. Counting it early is exactly the kind of guess Kosh refuses to make - the figure only moves once the money genuinely does.',
              },
              {
                question: 'I recorded my salary for less than expected',
                answer: 'That is fine - the real amount is what counts from then on. Kosh never treats a difference from the plan as a mistake to flag.',
              },
            ],
          },
        ],
      },
    ],
    related: ['income.adding-your-salary', 'today.real-balance'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
];
