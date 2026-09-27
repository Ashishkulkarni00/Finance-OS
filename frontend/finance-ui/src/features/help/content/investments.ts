import type { DocTopic } from '../types';

/**
 * SIPs & RDs - new in Phase B (IN_APP_MANUAL.md §8), plus `investments.how-investments-works`,
 * the hub `InvestmentsGuideSheet`/`InvestmentsPrimer` render from after the retrofit.
 * `investments.sips-and-rds` is one of the topics `contextMap.ts` already pointed at
 * (`investment.row`) before it existed. Source:
 * `features/investments/components/AddInvestmentSheet.tsx`, `InvestmentRow.tsx`,
 * `InvestmentsCheckIn.tsx`.
 */
export const INVESTMENTS_TOPICS: DocTopic[] = [
  {
    id: 'investments.sips-and-rds',
    category: 'investments',
    slug: 'sips-and-rds',
    title: 'Reading a holding',
    summary: 'What has gone in is always known and exact. What it is worth is whatever you last told Kosh, and it says so.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A holding’s headline figure is what has gone in - the total you have put into it - not what it is worth. That is the figure Kosh can always stand behind, from real postings where the holding has an account. What it is worth sits beside it only once you have actually said.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'terms',
            items: [
              { term: 'Put in', means: 'What has gone into a holding - from real entries where it has an account, or what you stated where it doesn’t.' },
              { term: 'Worth', means: 'What you last said it’s worth, from a statement. The one figure you keep up to date by hand.' },
              { term: 'Growth', means: 'Worth minus put in. Only shown once a holding has been valued.' },
            ],
          },
          {
            kind: 'example',
            title: 'A SIP, valued three months ago',
            lines: [
              { label: 'Put in', value: '₹30,000' },
              { label: 'Worth (as at a statement)', value: '₹33,450' },
              { label: 'Growth', value: '+₹3,450 · 11.5%' },
            ],
            note: 'A holding that has never been valued shows "Not valued yet" instead of a growth figure - never a guessed one.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'A SIP or RD instalment is recorded as an Investment, from the bank account it leaves. It comes off your spending money without being counted as spending, because you still own it - the same discipline that keeps a transfer from ever being mistaken for an expense.',
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
                question: 'How do I record a SIP instalment?',
                answer:
                  'As an Investment from your bank account to the holding’s account. It leaves your spending money without being counted as spending, because you still own it.',
              },
              {
                question: 'Why isn’t my NPS or PF in net worth?',
                answer:
                  'A holding kept outside your accounts — deducted by an employer, say — has no account balance for net worth to add up. It’s tracked here by what you stated went in.',
              },
              {
                question: 'Is growth on this page the same as returns?',
                answer:
                  'It’s simply worth minus put in. It doesn’t account for when each instalment went in, so it isn’t an annual return — just an honest “how much more is there than I put in”.',
              },
            ],
          },
        ],
      },
    ],
    related: ['investments.valuing-a-holding', 'investments.adding-an-investment'],
    seeInApp: [{ label: 'Open Investments', to: '/money/investments' }],
  },
  {
    id: 'investments.valuing-a-holding',
    category: 'investments',
    slug: 'valuing-a-holding',
    title: 'Telling Kosh what a holding is worth',
    summary: 'Growth only appears once you have said what a holding is worth, from a real statement - never from an estimated market value.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: '"Value" on a holding’s row records what your latest statement says it is worth. It is the one figure in Investments you are expected to keep up to date by hand, because nothing here fetches a live market price.',
          },
          {
            kind: 'example',
            title: 'A SIP checked against its statement',
            lines: [
              { label: 'Put in', value: '₹30,000' },
              { label: 'Worth (from the statement)', value: '₹33,450' },
              { label: 'Growth', value: '+₹3,450 · 11.5%' },
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
              'Open your statement for the holding.',
              'Press Value on its row.',
              'Enter what the statement says it is worth today, and save.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'Growth (worth minus put in) appears immediately. After about three months, that value is flagged as worth a refresh - not wrong, just old enough that the growth shown for it may be off.',
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
                question: 'How often should I add a value?',
                answer: 'Whenever you check a statement — once a quarter is plenty. After three months a value is flagged as worth refreshing.',
              },
              {
                question: 'Why is no growth shown?',
                answer:
                  'Nothing has been valued yet. Tap Value on a holding and enter what your statement says it’s worth — growth appears straight away. A guessed market value would look exact and could be far off.',
              },
            ],
          },
        ],
      },
    ],
    related: ['investments.sips-and-rds'],
    seeInApp: [{ label: 'Open Investments', to: '/money/investments' }],
  },
  {
    id: 'investments.adding-an-investment',
    category: 'investments',
    slug: 'adding-an-investment',
    title: 'Adding a holding',
    summary: 'Two shapes: a holding you pay into from an account Kosh tracks, or one kept entirely outside it, like an employer-deducted PF.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Most holdings have a ledger account behind them - a SIP into a fund, an RD - and for those, the account’s own balance is the truth about how much has gone in, fed by real postings. Some have none at all: a provident fund an employer deducts at source never touches an account Kosh tracks. This form asks which kind, then sets each one up accordingly.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            items: [
              { label: 'Name', what: 'A name you will recognise.', example: 'SIP - Zerodha, Provident fund…', requirement: 'required' },
              { label: 'Kind', what: 'Mutual fund SIP, mutual fund, recurring deposit, fixed deposit, provident fund, PPF, NPS, stocks, gold, or other.', requirement: 'required' },
              { label: 'Tracked', what: '"As an account I pay into" (Kosh tracks postings) or "Outside the ledger - I’ll state the figure" (an employer-deducted fund, say).', requirement: 'required' },
              { label: 'Put in so far', what: 'How much has gone in to date.', requirement: 'required' },
              { label: 'Monthly', what: 'The regular contribution, if there is one.', requirement: 'optional' },
              { label: 'On the', what: 'The day of the month it goes in. Only shown once a monthly amount is entered.', requirement: 'optional' },
              { label: 'Paid from', what: 'The account the contribution leaves from - left blank for something an employer deducts before you ever see it.', requirement: 'optional' },
              { label: 'Worth today', what: 'What it is currently worth, if you have checked recently. Leave it blank if you have not - Kosh never estimates this for you.', requirement: 'optional' },
              { label: 'Reachable?', what: '"Yes - I could get at it if I needed to" or "No - locked away" (a provident fund, a locked-in deposit).', requirement: 'required' },
              { label: 'Note', what: 'Anything worth remembering.', requirement: 'optional' },
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
              'Open "Add a holding" from Investments.',
              'Name it and choose its kind.',
              'Say whether Kosh should track it as an account you pay into, or as a figure you state yourself.',
              'Enter what has gone in so far, and a monthly contribution if there is one.',
              'Leave "Worth today" blank unless you have a current statement to hand.',
              'Say whether it is money you could reach if you needed to, and save.',
            ],
          },
          {
            kind: 'example',
            title: 'Adding a SIP',
            lines: [
              { label: 'Name', value: 'SIP - Zerodha' },
              { label: 'Kind', value: 'Mutual fund SIP' },
              { label: 'Monthly', value: '₹2,500' },
              { label: 'Put in so far', value: '₹0 - just starting' },
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
                question: 'I have not checked what it is worth lately - should I guess?',
                answer:
                  'No - leave "Worth today" blank. Kosh tracks what you have put in either way, and shows a gain only once you tell it a real value, never an estimated one.',
              },
              {
                question: 'What does "Reachable?" actually change?',
                answer: 'It decides whether the holding is ever treated as money you could turn to. A locked-away holding is invested but never counted as spending money or a reserve.',
              },
            ],
          },
        ],
      },
    ],
    related: ['investments.sips-and-rds', 'investments.valuing-a-holding'],
    seeInApp: [{ label: 'Add a holding', to: '/money/investments' }],
  },
  {
    id: 'investments.how-investments-works',
    category: 'investments',
    slug: 'how-investments-works',
    title: 'How Investments works',
    summary: 'How much you’ve put to work, where it is, and how it’s growing. What went in is always known; what it’s worth is whatever you last told it.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Investments answers how much you’ve put to work, where it is, and how it’s growing. What went in is always known; what it’s worth is whatever you last told it.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Put in', means: 'What has gone into a holding — from real entries where it has an account, or what you stated where it doesn’t.', primer: true },
              { term: 'Worth', means: 'What you last said it’s worth, from a statement. The one figure you keep up to date by hand.', primer: true },
              { term: 'Growth', means: 'Worth minus put in. Only shown once a holding has been valued.' },
              { term: 'Growing for later', means: 'Money that’s genuinely yours but can’t be reached if you need it - a PF, an NPS, a locked deposit. Never counted toward what you can spend.', primer: true },
            ],
          },
          {
            kind: 'example',
            title: 'Worth minus put in',
            lines: [
              { label: 'Put in', value: '₹30,000' },
              { label: 'Worth', value: '₹33,450' },
              { label: 'Growth', value: '+₹3,450' },
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
                question: 'How do I record a SIP instalment?',
                answer:
                  'As an Investment from your bank account to the holding’s account. It leaves your spending money without being counted as spending, because you still own it.',
              },
              {
                question: 'Why is no growth shown?',
                answer:
                  'Nothing has been valued yet. Tap Value on a holding and enter what your statement says it’s worth — growth appears straight away. A guessed market value would look exact and could be far off.',
              },
              {
                question: 'How often should I add a value?',
                answer: 'Whenever you check a statement — once a quarter is plenty. After three months a value is flagged as worth refreshing.',
              },
              {
                question: 'Why isn’t my NPS or PF in net worth?',
                answer:
                  'A holding kept outside your accounts — deducted by an employer, say — has no account balance for net worth to add up. It’s tracked here by what you stated went in.',
              },
              {
                question: 'Is growth on this page the same as returns?',
                answer:
                  'It’s simply worth minus put in. It doesn’t account for when each instalment went in, so it isn’t an annual return — just an honest “how much more is there than I put in”.',
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
              { thing: 'Every contribution you’ve recorded', where: 'Ledger — tap a holding', to: '/ledger' },
              { thing: 'The balance of the account a SIP leaves from', where: 'Accounts', to: '/money/accounts' },
              { thing: 'Whether this month’s SIP has gone out', where: 'Months, if it’s set up as a bill', to: '/month' },
            ],
          },
        ],
      },
    ],
    related: ['investments.sips-and-rds', 'investments.valuing-a-holding', 'investments.adding-an-investment'],
    seeInApp: [{ label: 'Open Investments', to: '/money/investments' }],
  },
];
