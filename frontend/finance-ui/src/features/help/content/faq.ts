import type { DocTopic } from '../types';

/**
 * FAQ - new in Phase B (IN_APP_MANUAL.md §8). Quick answers pulled together from across
 * the product for someone skimming rather than reading a topic start to finish; each
 * answer here also lives, in fuller form, on the topic linked beside it.
 */
export const FAQ_TOPICS: DocTopic[] = [
  {
    id: 'faq.general',
    category: 'faq',
    slug: 'general',
    title: 'Frequently asked questions',
    summary: 'Quick answers to the questions new users ask most, with a link to the full topic for each.',
    // Purely definitional: this topic *is* a list of questions and answers, each pointing at
    // the topic that works the thing through properly. An example here would duplicate one.
    definitional: true,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'These are the questions that come up most often in the first few days of using Kosh. Each answer is short on purpose - follow the link beside it for the full explanation.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            kind: 'qa',
            items: [
              { question: 'Is Kosh a budgeting app?', answer: 'Not in the usual sense - no spending limits to set and fail. See "What Kosh does".' },
              { question: 'Does Kosh connect to my bank?', answer: 'No - you record what happens yourself. See "What Kosh does".' },
              { question: 'Why does my month start on the 28th, not the 1st?', answer: 'Because that is when your salary lands. See "Why your month runs salary to salary".' },
              { question: 'Why did "Free until salary" drop when I didn’t spend anything?', answer: 'A bill was added, got its amount, or a balance was corrected. See "Free until salary".' },
              { question: 'Why does a number show "—"?', answer: 'A real figure it depends on is missing - Kosh will not guess it. See "Why some numbers show a dash".' },
              { question: 'Is a credit card swipe an expense or does it wait for the bill?', answer: 'An expense, the day you swipe. Paying the bill afterwards is a transfer. See "Card purchases vs. paying the bill".' },
              { question: 'Why is there no payoff date on my loan?', answer: 'No interest rate has been recorded for it yet. See "Reading a loan row".' },
              { question: 'Why isn’t my provident fund in net worth?', answer: 'It has no account balance for net worth to add up - it is tracked by what you stated went in. See "SIPs & RDs".' },
              { question: 'Why doesn’t insurance cover count toward net worth?', answer: 'Cover is money you would not have to find, not money you have. See "Cover: insurance is never an asset".' },
              { question: 'Can I set a monthly budget per category?', answer: 'No, deliberately - see "A few things Kosh deliberately does not do".' },
              { question: 'How do I fix a wrong account balance?', answer: 'Use "Update balance", not a correcting entry. See "Updating a balance".' },
              { question: 'Is my data ever permanently deleted?', answer: 'No - Kosh only ever soft-deletes. See "Why delete never destroys history".' },
            ],
          },
        ],
      },
    ],
    related: [
      'getting-started.welcome',
      'today.real-balance',
      'calculations.why-some-numbers-show-a-dash',
      'loans.understanding-a-loan',
    ],
  },
  {
    id: 'faq.is-my-data-safe',
    category: 'faq',
    slug: 'is-my-data-safe',
    title: 'Is my financial data safe in Kosh?',
    summary: 'Kosh never stores a full account or card number, a CVV, a PIN or an OTP - only the last four digits, and it never logs an amount or description.',
    // Purely definitional: a plain statement of what Kosh does and does not keep. A worked
    // example would be invented scaffolding around a policy, not help.
    definitional: true,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Kosh needs to know your balances and what you spend, but it does not need - and never keeps - the details that would make that information dangerous if seen by anyone else.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'terms',
            items: [
              { term: 'Account and card numbers', means: 'Only the last four digits are ever asked for or stored. Full numbers are never entered.' },
              { term: 'CVV, PIN, OTP', means: 'Never asked for, never stored, under any circumstance.' },
              { term: 'Amounts and descriptions', means: 'Never written to a log - what you record stays inside the product, not scattered across diagnostic output.' },
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
                question: 'Why does Kosh only ask for the last 4 digits?',
                answer: 'That is enough to tell your own accounts apart at a glance, without ever holding a number that could identify or be misused against a real account or card.',
              },
              {
                question: 'Is my data shared with anyone else using Kosh?',
                answer: 'No - every financial record carries the identity of the person it belongs to, and another user’s data is never visible, even by accident.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.adding-an-account', 'cards.adding-a-card'],
  },
];
