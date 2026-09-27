import type { DocTopic } from '../types';

/**
 * Getting started - Phase A, migrated to the sections model in Phase B
 * (IN_APP_MANUAL.md §5a). Written for someone who has never used a finance app and does
 * not know what Kosh calls anything yet.
 */
export const GETTING_STARTED_TOPICS: DocTopic[] = [
  {
    id: 'getting-started.welcome',
    category: 'getting-started',
    slug: 'welcome',
    title: 'What Kosh does',
    summary: 'Kosh answers one question every day: what can you actually spend right now, without touching money that already has a job.',
    startHereStep: 1,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Most money apps tell you what already happened - a list of what you spent last month. Kosh is built to answer a different question: what can you spend today, and what will a decision cost you before your next salary arrives?',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'It does that by keeping one running number. Add up everything in your bank accounts and cash. Take away money you have set aside for something specific, like an emergency fund. Take away every bill and EMI still to leave before your next salary. Take away what you have already spent on credit cards but not yet paid. What is left is genuinely yours to decide about - Kosh calls it "Free until salary".',
          },
          {
            kind: 'example',
            title: 'A worked example',
            lines: [
              { label: 'Held (bank + cash)', value: '₹68,400' },
              { label: '− Reserved (emergency fund)', value: '₹10,000' },
              { label: '− Committed (rent, EMIs, bills still due)', value: '₹42,300' },
              { label: '− Owed on cards', value: '₹4,200' },
              { label: '= Free until salary', value: '₹11,900' },
            ],
            note: 'That ₹11,900 is spread over the days left until salary, so you can see a fair share for today rather than one big number that invites spending it all at once.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Nothing here is a guess dressed up as a fact. Where Kosh does not have a number - a bill with no amount yet, an account balance no one has confirmed - it says so plainly rather than showing you a figure it cannot stand behind.',
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
                question: 'Is this a budgeting app?',
                answer:
                  'Not in the usual sense. There are no spending limits to set and fail. Kosh shows you your own recent spending as a comparison, not a target invented on an optimistic day.',
              },
              {
                question: 'Does it connect to my bank automatically?',
                answer:
                  'No. You record what happens - a payment, a transfer, money arriving - and Kosh keeps the running numbers honest from what you tell it. That is deliberate: an automatic feed you cannot correct is worse than one you control.',
              },
            ],
          },
        ],
      },
    ],
    related: ['getting-started.the-financial-month', 'today.real-balance'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'getting-started.the-financial-month',
    category: 'getting-started',
    slug: 'the-financial-month',
    title: 'Why your month runs salary to salary',
    summary: 'A Kosh month starts on the day your salary arrives and ends the day before your next one - not on the 1st.',
    startHereStep: 2,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Every bank statement and calendar app uses the 1st to the end of the month. But that is not when your money actually turns over - your salary is. If it lands on the 28th, the money you are really managing runs from the 28th of one month to the 27th of the next.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Kosh calls this a cycle, and shows it to you as "Months" - one salary-to-salary period at a time, named for the month it ends in. It matters because a bill due on the 3rd and your salary on the 28th are part of the same stretch of money, even though a calendar would put them in different months.',
          },
          {
            kind: 'example',
            title: 'Salary on the 28th',
            lines: [
              { label: 'This month', value: '28 Sep – 27 Oct' },
              { label: 'Salary expected', value: '₹57,700, on 28 Sep' },
              { label: 'Named', value: '"October" - the month it ends in' },
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
                question: 'Can I look at a future month before it starts?',
                answer:
                  'Yes. Use the arrow beside the month name on Months to move ahead. Anything you add there is planned for that month from the start.',
              },
              {
                question: 'What if my salary date changes?',
                answer: 'Edit the income commitment that represents your salary and Kosh works out the new cycle boundaries from it.',
              },
            ],
          },
        ],
      },
    ],
    related: ['getting-started.welcome', 'income.adding-your-salary'],
    seeInApp: [{ label: 'Open Months', to: '/month' }],
  },
  {
    id: 'getting-started.what-kosh-wont-do',
    category: 'getting-started',
    slug: 'what-kosh-wont-do',
    title: 'A few things Kosh deliberately does not do',
    summary: 'No per-category budgets, no salary-range labels, no numbers guessed on your behalf - and why each one is a choice, not a gap.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A few choices here are easy to mistake for missing features. They are not - each one was left out on purpose, because the obvious version of it tends to fail in practice.',
          },
          {
            kind: 'terms',
            items: [
              {
                term: 'No category budgets',
                means: 'A limit you set on a good day is easy to miss and then abandon. Instead, your flexible spending is shown against your own recent normal.',
              },
              {
                term: 'No guessed numbers',
                means: 'If a bill has no amount yet, or a balance was never confirmed, Kosh says so rather than filling in a number it cannot stand behind.',
              },
              {
                term: 'No calendar months',
                means: 'Every date you see is a real date - "3 Oct", never "week 2 of the salary month".',
              },
            ],
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'Groceries this month, against your own normal',
            lines: [
              { label: 'Last 3 months, groceries', value: '₹8,200 a month, on average' },
              { label: 'This month so far', value: '₹8,900' },
            ],
            note: 'Kosh shows this as a comparison, nothing more - there is no limit being breached, and no warning either way, because ₹8,200 was never a budget you agreed to.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'callout',
            tone: 'note',
            text: 'If a number ever looks wrong, the fix is almost always the same: check the account balance it comes from, or give a bill its real amount. Every figure in Kosh is worked out from those, never typed in on its own.',
          },
        ],
      },
    ],
    related: ['getting-started.welcome', 'calculations.derived-never-stored'],
  },
];
