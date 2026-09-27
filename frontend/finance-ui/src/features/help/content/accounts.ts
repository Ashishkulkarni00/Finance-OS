import type { DocTopic } from '../types';

/**
 * Accounts - Phase A content migrated to the sections model, plus Phase B's
 * `accounts.how-accounts-works` hub topic, which is what `AccountsGuideSheet` and
 * `AccountsPrimer` render from after the retrofit (IN_APP_MANUAL.md §1, §8). Field
 * labels and behaviour taken directly from `features/accounts/components/AccountFormFields.tsx`
 * and `UpdateBalanceSheet.tsx` - not from what the form ought to ask.
 */
export const ACCOUNTS_TOPICS: DocTopic[] = [
  {
    id: 'accounts.adding-an-account',
    category: 'accounts',
    slug: 'adding-an-account',
    title: 'Adding an account',
    summary: 'Every bank account, cash wallet, loan and investment you track starts here - one form, the same for all of them.',
    startHereStep: 3,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'An account is anywhere money sits: a bank account, cash in hand, a loan you owe, or an investment you hold. Kosh needs each one added once, with what it holds right now, before it can tell you anything about your money.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Adding accounts is worth doing properly at the start - every other number in Kosh, from what you can spend today to your net worth, is built up from these balances.',
          },
          {
            kind: 'example',
            title: 'Adding the salary account',
            lines: [
              { label: 'Type', value: 'Bank' },
              { label: 'Name', value: 'HDFC Salary' },
              { label: 'Balance today', value: '₹42,300' },
              { label: 'How sure?', value: 'Confirmed' },
              { label: 'Spending money?', value: 'Yes' },
            ],
            note: 'The moment this is saved, ₹42,300 becomes part of Held on Today - it is already inside the Free until salary figure before you do anything else.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: 'The "Add account" form, in the order it asks. Credit cards are added from Cards instead, with their own form for limit and billing date.',
            items: [
              {
                label: 'Bank / Cash / Loan / Investment',
                what: 'Which kind of account this is. It cannot be changed later, because everything Kosh works out from an account depends on knowing what kind it is.',
                requirement: 'required',
              },
              { label: 'Name', what: 'Something you will recognise - "HDFC Salary", "Cash Wallet".', example: 'HDFC Salary, Cash Wallet…', requirement: 'required' },
              { label: 'Institution', what: 'The bank or lender, if there is one.', example: 'HDFC, IDBI…', requirement: 'optional' },
              { label: 'Last 4', what: 'The last four digits only - Kosh never stores a full account or card number.', requirement: 'optional' },
              {
                label: 'Balance today / Owed today',
                what: 'What the account holds right now. For a loan or a credit card this asks what you owe, as a positive number.',
                example: 'e.g. -12000 if money is owed, when the type itself does not already ask "owed"',
                requirement: 'required',
              },
              { label: 'As of', what: 'The date that balance is true for. Defaults to today and cannot be in the future.', requirement: 'auto' },
              {
                label: 'How sure?',
                what: '"Confirmed - read off the bank", "Estimated - a considered figure", or "Unknown - I\'m not sure". This is what decides whether your net worth is labelled Approximate.',
                requirement: 'required',
              },
              {
                label: 'Minimum',
                what: 'A balance the bank requires you to keep in (bank accounts only). Leave it blank if there is none.',
                requirement: 'optional',
              },
              {
                label: 'Mandatory?',
                what: 'Only shown once a minimum is entered. "Yes - the bank enforces it" or "No - my own target" - it changes whether that money is treated as untouchable or just a personal line.',
                requirement: 'optional',
              },
              {
                label: 'Spending money?',
                what: '"Yes - day to day" or "No - savings" (bank and cash accounts only). An emergency fund kept in a savings account should say No, or its whole balance would count toward what you can spend.',
                requirement: 'required',
              },
              { label: 'Purpose', what: 'A note on what the account is for, if it helps you remember.', requirement: 'optional' },
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
              'Open the Add button and choose the account type.',
              'Give it a name you will recognise at a glance.',
              'Enter what it holds right now, and how sure you are of that figure.',
              'For a bank account, add a minimum balance if your bank enforces one, and say whether the account is day-to-day spending money or savings.',
              'Save. The account appears immediately wherever it belongs - Accounts, and anywhere it can be chosen as a source or destination.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'Once saved, the account is available as a source or destination the next time you record a transaction or add a commitment. Its balance moves only from what you record against it, or from "Update balance" if you want to reset it to what your bank shows.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'This is also what makes the rest of Kosh trustworthy: Free until salary, Room, and net worth are all built from account balances, so getting these right once means everything downstream is right too.',
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
                question: 'I added a loan as a bank account by mistake',
                answer:
                  'Delete it and add it again as a Loan. As a bank account, it is counted both as spending money and as something you own - a loan should only ever count against you.',
              },
              {
                question: 'Why can\'t I change the type after saving?',
                answer:
                  'Every figure Kosh has already worked out from that account - its balance, whether it counts toward net worth or Free until salary - depends on knowing what kind of account it is. Changing the type after the fact would quietly re-sign numbers you already trusted.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.balance-vs-available', 'accounts.net-worth', 'accounts.updating-a-balance'],
    seeInApp: [{ label: 'Add an account', to: '/money/accounts' }],
  },
  {
    id: 'accounts.balance-vs-available',
    category: 'accounts',
    slug: 'balance-vs-available',
    title: 'Balance vs. Available',
    summary: 'A balance is what an account holds. Available is what you can actually move out of it - and the two are not always the same number.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Every account can show two figures. Most of the time they match, so Kosh shows just one. When they differ, both appear, because a single number would hide something you need to know.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Balance', means: 'What the account holds right now, from its opening balance and every entry since.' },
              { term: 'Held', means: 'The part you should not move: the bank’s required minimum, or money you reserved for something - whichever is larger.' },
              { term: 'Available', means: 'Balance minus what is held. What you can actually move out of this account.' },
            ],
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A savings account with a bank minimum',
            lines: [
              { label: 'Balance', value: '₹25,000' },
              { label: 'Held (bank minimum)', value: '₹10,000' },
              { label: 'Available', value: '₹15,000' },
            ],
            note: 'The extra ₹10,000 is real money in the account - it is just not yours to move without falling below what the bank requires.',
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
                question: 'An account shows below zero',
                answer:
                  'Either it is genuinely overdrawn - and anything else debiting it can bounce - or it is actually a loan that was added as a bank account, which belongs under Debts instead.',
              },
              {
                question: 'What does "Pays for" mean on an account row?',
                answer: 'The bills set to leave from that account every month, so you can see at a glance what depends on it.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.adding-an-account', 'today.real-balance'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
  {
    id: 'accounts.net-worth',
    category: 'accounts',
    slug: 'net-worth',
    title: 'Net worth, and why it says "Approximate"',
    summary: 'Everything you own minus everything you owe, built entirely from your account balances - so it is only ever as exact as they are.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Net worth adds up every account that counts toward what you own, and subtracts every one that counts toward what you owe. It is not a separate figure you enter - it is entirely derived from the accounts you have already added.',
          },
          {
            kind: 'prose',
            text: 'That is also why it can carry an "Approximate" label: net worth can only be as exact as the balances behind it. If even one account’s starting balance was entered as an estimate, or left unknown, the total inherits that uncertainty rather than hiding it.',
          },
          {
            kind: 'example',
            title: 'One estimated balance is enough to flag the whole total',
            lines: [
              { label: 'Bank + cash (confirmed)', value: '₹68,400' },
              { label: 'Investments (estimated)', value: '₹1,40,000' },
              { label: 'Loan outstanding (confirmed)', value: '−₹2,10,000' },
              { label: 'Net worth', value: '−₹1,600 · Approximate' },
            ],
            note: 'Confirm the investment balance against a statement and the label goes away on its own - nothing else about the figure changes.',
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
                question: 'Why is my net worth negative?',
                answer:
                  'Everything you owe that is recorded here is more than everything you own that is recorded here. That is normal while paying off a loan - it is a position, not a verdict.',
              },
              {
                question: 'How do I make the "Approximate" label go away?',
                answer: 'Confirm the estimated or unknown account balances against a statement, using "Update balance" - once every balance behind net worth is Confirmed, the label goes away on its own.',
              },
              {
                question: 'My investments aren’t in net worth',
                answer:
                  'Holdings kept outside your accounts - an NPS or PF your employer deducts, say - have no account balance to add up, and nothing counts until it is valued. Add what they are worth on the Investments tab.',
              },
            ],
          },
        ],
      },
    ],
    related: ['accounts.balance-vs-available', 'accounts.adding-an-account', 'calculations.net-worth-and-approximate'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
  {
    id: 'accounts.updating-a-balance',
    category: 'accounts',
    slug: 'updating-a-balance',
    title: 'Updating a balance',
    summary: 'Resets an account to what your bank shows right now, rather than adding another entry - so nothing is ever counted twice.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Sooner or later a balance drifts from what you actually see in your banking app - a missed entry, a bank charge you never recorded. "Update balance" fixes that by re-anchoring the account, not by adding a correcting entry.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'From that point on, the account’s balance is the figure you entered, plus anything recorded strictly after the date you gave. Everything up to and including that date is treated as already inside the figure, so it is never added a second time.',
          },
          {
            kind: 'example',
            title: 'Re-anchoring after a missed bank charge',
            lines: [
              { label: 'Kosh’s balance (drifted)', value: '₹18,730' },
              { label: 'Bank shows today', value: '₹19,650' },
              { label: 'True as of', value: '26 Sep 2026' },
            ],
            note: 'Everything recorded strictly after 26 Sep counts on top of ₹19,650 - the missed charge itself is never chased down or entered separately.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            items: [
              { label: 'Balance now / Owed now', what: 'What your bank or statement shows today. For a loan or card, the total you owe as a positive amount.', requirement: 'required' },
              { label: 'True as of', what: 'The date this figure is accurate for. Cannot be in the future.', requirement: 'required' },
              { label: 'How sure?', what: 'Confirmed, Estimated, or Unknown - the same scale as adding an account.', requirement: 'required' },
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
              'Open "Update balance" from the account’s row.',
              'Enter what your bank shows right now, and the date that figure is true for.',
              'Say how sure you are of it, and save.',
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
            text: 'Do this as the last thing on the date you choose. An entry you add afterwards with that same date will not be counted, because everything up to and including it is already folded into the figure you entered.',
          },
        ],
      },
    ],
    related: ['accounts.adding-an-account', 'accounts.balance-vs-available', 'corrections.fixing-a-wrong-balance'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
  {
    id: 'accounts.how-accounts-works',
    category: 'accounts',
    slug: 'how-accounts-works',
    title: 'How Accounts works',
    summary: 'What you own, what you owe, and what each account can actually do for you right now. It explains money; it never moves it.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Accounts is where every bank account, cash wallet, loan and investment lives, and where the two figures that most often look like they should agree - a balance and what is available, net worth and what feels like "mine" - each get a one-sentence reason for the gap.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Balance', means: 'What the account holds right now, from your opening balance and every entry since.', primer: false },
              { term: 'Held', means: 'The part you shouldn’t move: the bank’s required minimum, or money you reserved - whichever is larger.', primer: false },
              { term: 'Available', means: 'Balance minus what’s held. What you can actually move out of this account.', primer: true },
              { term: 'Net worth', means: 'Everything you own minus everything you owe, built from these same balances.', primer: true },
              { term: 'Needs a look', means: 'An account problem worth fixing - a balance below zero, or one gone stale.', primer: true },
            ],
          },
          {
            kind: 'example',
            title: 'A savings account with money reserved',
            lines: [
              { label: 'Balance', value: '₹42,300' },
              { label: 'Held (reserved)', value: '₹10,000' },
              { label: 'Available', value: '₹32,300' },
            ],
            note: 'The ₹10,000 is real money in the account - it is just not counted as yours to move, because it already has a job.',
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
                question: 'Why is my net worth negative?',
                answer:
                  'Everything you owe that’s recorded here is more than everything you own that’s recorded here. That’s normal while paying off a loan — it’s a position, not a verdict.',
              },
              {
                question: 'Why does net worth say “Approximate”?',
                answer:
                  'At least one account’s starting balance was entered as an estimate or left unknown. Net worth is built from account balances, so it can only be as exact as they are. Confirm those balances against a statement and the label goes away.',
              },
              {
                question: 'A bank account shows below zero',
                answer:
                  'Either it’s genuinely overdrawn — and anything else debiting it can bounce — or it’s actually a loan that was added as a bank account. A loan belongs under Debts; as a bank account it’s counted as spending money and as something you own.',
              },
              {
                question: 'My investments aren’t in net worth',
                answer:
                  'Holdings kept outside your accounts — an NPS or PF your employer deducts, say — have no account balance to add up, and nothing counts until it’s valued. Add what they’re worth on the Investments tab.',
              },
              {
                question: 'What does “Pays for” mean on an account?',
                answer: 'The bills set to leave from that account every month, so you can see at a glance what depends on it.',
              },
              {
                question: 'How is “Yours to move” different from what’s free on Months?',
                answer:
                  'Yours to move is before this cycle’s bills. Months takes every bill still due out of it, which is why its figure is smaller.',
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
              { thing: 'What you spent this cycle, and what’s still due', where: 'Months', to: '/month' },
              { thing: 'Every entry behind a balance', where: 'Ledger', to: '/ledger' },
              { thing: 'What you can spend today', where: 'Today', to: '/today' },
              { thing: 'Recording a payment or a transfer', where: 'the Add button' },
            ],
          },
        ],
      },
    ],
    related: ['accounts.balance-vs-available', 'accounts.net-worth', 'accounts.adding-an-account'],
    seeInApp: [{ label: 'Open Accounts', to: '/money/accounts' }],
  },
];
