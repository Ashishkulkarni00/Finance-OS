import type { DocTopic } from '../types';

/**
 * Today - Phase A content migrated to sections, plus Phase B's `today.how-today-works`
 * hub topic, which `TodayGuideSheet` and `TodayPrimer` render from after the retrofit.
 * The derivation chain and the wording ("Free until salary", "a day until salary", "left
 * today") are taken from `features/today/components/Pulse.tsx` and `TodayGuideSheet.tsx` -
 * the numbers themselves are never restated here, only what they mean.
 */
export const TODAY_TOPICS: DocTopic[] = [
  {
    id: 'today.the-today-screen',
    category: 'today',
    slug: 'the-today-screen',
    title: 'Reading the Today screen',
    summary: 'One figure - what you can spend without touching money that already has a job - plus whatever needs your attention right now.',
    startHereStep: 7,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Today answers one question: what can you spend today, without touching money that is already spoken for? Everything on the page supports that one figure - it never tries to be a second Months or a second Ledger.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Below the hero figure, "Needs you" lists anything worth acting on now - an overdue bill, an account below zero, a card payment coming due. If nothing needs you, it says so plainly rather than showing nothing at all.',
          },
          {
            kind: 'example',
            title: 'A Saturday, six days from salary',
            lines: [
              { label: 'Free until salary', value: '₹16,950' },
              { label: 'A day', value: '₹2,825' },
              { label: 'Needs you', value: '1 item' },
            ],
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'callout',
            tone: 'note',
            text: 'Today deliberately does not show every bill this month, or every transaction - those live on Months and the Ledger. Today is the next 24 hours.',
          },
        ],
      },
    ],
    related: ['today.real-balance', 'today.room'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'today.real-balance',
    category: 'today',
    slug: 'real-balance',
    title: 'Free until salary (your Real Balance)',
    summary: 'What is genuinely yours to decide about until your next salary - everything you hold, minus everything already spoken for.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'This is the number Kosh is built around. It starts from everything you hold in bank accounts and cash, then takes away money you have reserved for something specific, every bill and EMI still due before your next salary, and whatever you already owe on credit cards. What is left is Free until salary.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Knowing this number is the point of the whole product: it means you can make a decision today - can I afford this - without doing the subtraction yourself, and without accidentally spending money that already has a bill’s name on it.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'table',
            head: ['', 'Meaning'],
            rows: [
              ['Held', 'Everything in your bank accounts and cash, right now.'],
              ['− Reserved', 'Money you have set aside for something specific - an emergency fund, a trip.'],
              ['− Committed', 'Bills and EMIs still to leave before your next salary.'],
              ['− Owed on cards', 'Already spent on credit cards, still to be paid.'],
              ['= Free until salary', 'What is genuinely yours to decide about until payday.'],
            ],
          },
          {
            kind: 'example',
            title: 'Six days from salary',
            lines: [
              { label: 'Held', value: '₹52,300' },
              { label: '− Reserved', value: '₹0' },
              { label: '− Committed', value: '₹31,200' },
              { label: '− Owed on cards', value: '₹4,150' },
              { label: '= Free until salary', value: '₹16,950' },
            ],
            note: 'Every one of those lines is a real figure from somewhere else in Kosh - an account balance, a reservation, a commitment’s remaining amount. Nothing here is invented; "How is this worked out?" on Today opens the same breakdown, with the actual numbers behind each line.',
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
                question: 'Free until salary dropped, but I did not spend anything',
                answer:
                  'Something new was claimed: a bill was added or its amount became known, you reserved money for something, or an account balance was corrected downward.',
              },
              {
                question: 'Free until salary went up',
                answer: 'Money arrived (income, a refund), a bill settled for less than expected, or a reservation was released.',
              },
              {
                question: 'The figure shows "—" instead of an amount',
                answer:
                  'A bill that must be paid has no amount yet, so what is left cannot honestly be known. This is Kosh refusing to guess rather than a fault - give the bill an amount, even an estimate, and the figure comes back.',
              },
              {
                question: 'An account says it is "already short"',
                answer:
                  'It holds less than zero. Usually an overdraft - or a loan that was added as a bank account, which then wrongly counts against your spending money. A loan belongs under Debts.',
              },
            ],
          },
        ],
      },
    ],
    related: ['today.room', 'accounts.balance-vs-available', 'monthly-plan.adding-a-commitment', 'calculations.free-until-salary'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'today.room',
    category: 'today',
    slug: 'room',
    title: 'Room: a fair share for today',
    summary: 'Free until salary spread evenly over the days left, so one big number does not tempt you to spend it all at once.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Free until salary is what is left over your whole stretch until payday - but a single large number invites spending it all today. Room takes that figure and divides it by the days remaining, so you see a fair daily share instead.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Underneath the day’s share, Kosh also shows what you have already spent today and what that leaves of today’s share specifically - so you can see, in the moment, whether today is already tight.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'A day', means: 'Free until salary, spread evenly over the days left until your next salary.' },
              { term: 'Spent today', means: 'What has already left your accounts today, counted only against today’s share.' },
              { term: 'Left today', means: 'Today’s share minus what you have spent today.' },
            ],
          },
          {
            kind: 'example',
            title: 'Six days to salary, ₹16,950 free',
            lines: [
              { label: 'A day', value: '₹2,825' },
              { label: 'Spent today', value: '₹640' },
              { label: 'Left today', value: '₹2,185' },
            ],
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Spending more than a day’s share is never blocked or flagged as a failure - it simply means tomorrow’s share is a little smaller, because the total left until salary has not changed, only how many days are left to spread it over.',
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
                question: 'I spent more than today’s share - what happens?',
                answer: 'Nothing is stopped. The page says "today’s share used - tomorrow’s will be a little smaller", and it will be, because the same total is now spread over the remaining days.',
              },
              {
                question: 'Does Room count credit card spending?',
                answer: 'No. Credit cards, loans and investments are never counted as spending money - Room only ever reflects bank and cash accounts you have marked as spending money.',
              },
            ],
          },
        ],
      },
    ],
    related: ['today.real-balance', 'months.the-month-line'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'today.how-today-works',
    category: 'today',
    slug: 'how-today-works',
    title: 'How Today works',
    summary: 'What can I spend today, without touching money that’s already spoken for - and a warning before anything goes wrong.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Today is judged by one figure, and a figure people do not understand is one they second-guess against their banking app - at which point the product has stopped doing its job. This topic is the full derivation, and the questions that figure actually raises.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Held', means: 'Everything in your bank accounts and cash, right now.' },
              { term: '− Reserved', means: 'Money you set aside for something specific - an emergency fund, a trip.' },
              { term: '− Committed', means: 'Bills and EMIs still to leave before your next salary.' },
              { term: '− Owed on cards', means: 'Already spent on credit cards, still to be paid.' },
              { term: '= Free until salary', means: 'What is genuinely yours to decide about until payday.', primer: true },
              { term: '÷ Days to salary', means: 'Spread evenly - "a day" under the big number. Spend less and tomorrow’s share grows.', primer: true },
              { term: 'Needs you', means: 'Something worth acting on now - act on it from the list right under the big number.', primer: true },
            ],
          },
          {
            kind: 'example',
            title: 'Two days from salary',
            lines: [
              { label: 'Held', value: '₹9,800' },
              { label: '− Committed', value: '₹0' },
              { label: '− Owed on cards', value: '₹1,200' },
              { label: '= Free until salary', value: '₹8,600' },
              { label: '÷ 2 days', value: '₹4,300 a day' },
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
                question: 'Free until salary dropped, but I didn’t spend anything',
                answer:
                  'Something new was claimed: a bill was added or its amount became known, you reserved money, or an account balance was corrected downward.',
              },
              {
                question: 'Free until salary went up',
                answer: 'Money arrived (income, a refund), a bill settled for less than expected, or a reservation was released.',
              },
              {
                question: 'The big number shows "—"',
                answer:
                  'A bill that must be paid has no amount yet, so what’s left can’t be known. Give it an amount - even an estimate - and the number comes back.',
              },
              {
                question: 'An account says it’s "already short"',
                answer:
                  'It holds less than zero. Usually an overdraft - or a loan that was added as a bank account, which then counts against your spending money. Loans belong under Debts.',
              },
              {
                question: 'A bill says "not yet confirmed"',
                answer: 'You marked it to double-check with the bank. Once it shows on your statement, press Confirm.',
              },
              {
                question: 'A bill is overdue',
                answer: 'Its date passed without being settled. Settle it if you paid, and the payment is recorded in the Ledger.',
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
              { thing: 'Every bill this cycle, not just the next few', where: 'Months', to: '/month' },
              { thing: 'Every transaction, and why a balance is what it is', where: 'Ledger', to: '/ledger' },
              { thing: 'Account balances, cards and net worth', where: 'Accounts', to: '/money/accounts' },
              { thing: 'Loans and how much is left on each', where: 'Debts', to: '/money/debts' },
            ],
          },
        ],
      },
    ],
    related: ['today.real-balance', 'today.room'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'today.free-this-month',
    category: 'today',
    slug: 'free-this-month',
    title: '"Free this month" vs. Free until salary',
    summary: 'The same "what is left after bills" idea as Free until salary, but over the whole cycle rather than just what remains of it.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Free until salary answers "what can I spend between now and payday". "Free this month", underneath it on Today, answers a related but different question: over the whole current cycle, once everything expected in has paid for everything committed and set aside, what is left for everything flexible? It is the same figure Months leads with as "Flexible".',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A month with a plan already in place',
            lines: [
              { label: 'Comes in', value: '₹57,700' },
              { label: '− Committed', value: '₹38,900' },
              { label: '− Set aside', value: '₹5,500' },
              { label: '= Free this month', value: '₹13,300' },
            ],
            note: 'This looks at the whole cycle, salary to salary - which is why it is usually bigger than Free until salary, the figure just for the days left in it.',
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
                question: '"Free this month" and Free until salary show different numbers - which is wrong?',
                answer:
                  'Neither. Free until salary is what is left over the days still to come; Free this month is the whole cycle’s Flexible figure. They agree only right after salary lands, before anything flexible has been spent.',
              },
              {
                question: 'It shows "nothing planned this month" - is that bad?',
                answer: 'No - it means no bills or savings have been added to this cycle yet, so there is nothing to weigh the figure against. Add a commitment to see the real shape.',
              },
            ],
          },
        ],
      },
    ],
    related: ['today.real-balance', 'months.the-month-line', 'months.day-to-day-spending'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'today.if-income-stopped',
    category: 'today',
    slug: 'if-income-stopped',
    title: '"If income stopped": how long you would last',
    summary: 'What could be reached quickly, divided by the essentials that must be paid every month - a runway, not a prediction.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: '"If income stopped" answers a different question from Free until salary: not "what can I spend this cycle" but "if nothing else came in, how long could I keep paying what I must pay". It divides everything you could reach quickly - reachable savings and investments, not locked-away ones - by your must-pay bills each month.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A runway of a few months',
            lines: [
              { label: 'Reachable', value: '₹2,10,000' },
              { label: 'Must-pay a month', value: '₹42,000' },
              { label: 'If income stopped', value: '5 months' },
            ],
            note: 'Day-to-day spending sits on top of the 5 months, so it is a floor, not the whole story - the "How is this worked out?" line under it opens the exact accounts and bills counted.',
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
                question: 'It shows "at most" before a number',
                answer: 'One or more of your must-pay bills has no amount yet, so the true runway could be shorter than shown. Give the bill an amount to see the real figure.',
              },
              {
                question: 'Why doesn’t it count my locked-away investments?',
                answer: 'A provident fund or a locked-in deposit cannot be turned into money quickly if income actually stopped, so counting it would overstate how long you could really last.',
              },
              {
                question: 'It shows "—" instead of a number',
                answer: 'Something it depends on is unknown - usually a must-pay bill with no amount, or no reachable balance recorded at all. The line beside it says which.',
              },
            ],
          },
        ],
      },
    ],
    related: ['today.real-balance', 'goals.the-emergency-fund', 'investments.sips-and-rds'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
  {
    id: 'today.owed-across-loans',
    category: 'today',
    slug: 'owed-across-loans',
    title: '"Owed": every loan, as one position',
    summary: 'What every loan together still owes, what share of your income services it, and when the last one clears - one line, not five.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'The "Owed" line on Today adds every loan’s outstanding balance into one figure, alongside what share of your income goes to EMIs each month and the date your last loan clears - a single position, rather than reading five rows on Debts to work it out yourself.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'Three loans, read as one position',
            lines: [
              { label: 'Owed', value: '₹2,85,000' },
              { label: 'Of income to EMIs', value: '18%' },
              { label: 'Clear', value: 'Dec 2029' },
            ],
            note: '"Clear" is the latest of every loan’s own payoff date - it only appears once every loan involved has the real terms to support one.',
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
                question: 'It says "N without terms" - what does that mean?',
                answer: 'That many loans have no interest rate recorded, so they contribute to the total owed but not to the "clear by" date or the interest/principal split. Add their rates to complete the picture.',
              },
              {
                question: 'Is this the same as "Still to pay" on a loan’s own row?',
                answer: 'No - Owed here is the principal outstanding across every loan, the amount a lender would ask for to close them today. "Still to pay" on Debts is every future EMI added up, interest included.',
              },
            ],
          },
        ],
      },
    ],
    related: ['loans.outstanding-vs-remaining', 'loans.how-debts-works'],
    seeInApp: [{ label: 'Open Today', to: '/today' }],
  },
];
