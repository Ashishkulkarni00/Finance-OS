import type { DocTopic } from '../types';

/**
 * Recording expenses - Phase A content migrated to sections, plus Phase B's
 * `spending.how-the-ledger-works` hub topic, which `LedgerGuideSheet` and `LedgerPrimer`
 * render from after the retrofit. Field labels and the five transaction types' own
 * guidance text are taken directly from
 * `features/transactions/components/transactionForm.ts` and `TransactionFormFields.tsx`.
 */
export const SPENDING_TOPICS: DocTopic[] = [
  {
    id: 'spending.recording-an-expense',
    category: 'spending',
    slug: 'recording-an-expense',
    title: 'Recording an expense',
    summary: 'The Add button - the one control you will use most. It records money moving, and every other number in Kosh follows from it.',
    startHereStep: 6,
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Every rupee that moves - spent, earned, transferred between your own accounts, or invested - is recorded here, once, on the day it happened. This is the single most important habit in using Kosh: the more faithfully this is kept up, the more the rest of the product can be trusted.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Recording is quick on purpose: an amount, what it was for, and the account it came from is enough. Everything else is optional.',
          },
          {
            kind: 'example',
            title: 'Coffee with a friend',
            lines: [
              { label: 'Expense', value: '₹180' },
              { label: 'What for', value: 'Coffee' },
              { label: 'Category', value: 'Eating out' },
              { label: 'Account', value: 'Cash' },
            ],
            note: 'Saved, this leaves Cash immediately and comes off today’s share on Room - the whole entry took four fields.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: 'Five kinds of movement, each showing a different set of fields.',
            items: [
              { label: 'Expense', what: 'Money that left you for good. A card swipe goes here on the day you swiped it - not when the bill is paid.', requirement: 'required' },
              { label: 'Income', what: 'Money that arrived from outside - salary, a client, interest. Not money you moved between your own accounts.', requirement: 'required' },
              { label: 'Transfer', what: 'Money moving between accounts you already own: paying a card bill, taking out cash, paying down a loan. Never spending.', requirement: 'required' },
              { label: 'Investment', what: 'Money moving into something you still hold - a SIP instalment, an RD. You keep it, so it is not spending.', requirement: 'required' },
              { label: 'Refund', what: 'Money coming back against something you already spent on. It uses the spending category it reverses, not an income one.', requirement: 'required' },
              { label: 'Amount', what: 'How much moved.', requirement: 'required' },
              { label: 'What for', what: 'A short description.', example: 'Coffee, rent, groceries…', requirement: 'required' },
              { label: 'Category', what: 'Shown for Expense, Income and Refund - groups it with similar spending.', requirement: 'required' },
              { label: 'Account (or From)', what: 'Where the money came from. Only accounts that fit the chosen type are offered.', requirement: 'required' },
              { label: 'To', what: 'Shown for Transfer and Investment - the account it lands in.', requirement: 'required' },
              { label: 'Date', what: 'When it actually happened. Cannot be in the future.', requirement: 'required' },
              { label: 'Note', what: 'Anything worth remembering - what a correction was for, say.', requirement: 'optional' },
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
              'Press Add (or Ctrl/Cmd+K from anywhere in the product).',
              'Choose the kind of movement - Expense is the default.',
              'Enter the amount.',
              'Add a short description and, for an expense or income, its category.',
              'Check the account it is coming from (or going to, for a transfer), and the date.',
              'Save. It appears in the Ledger immediately, and Free until salary updates the instant you save.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'The moment you save, the account’s balance and Free until salary both reflect it - that immediate change is deliberate: seeing the number move is what makes recording feel worth doing.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'This is also the record everything else checks against. A loan’s outstanding balance, a commitment’s settled status, a card’s statement - all of them read from transactions recorded here, never from a separate total kept anywhere else.',
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
                question: 'I paid by credit card - is that an expense or a transfer?',
                answer:
                  'An expense, on the day you swiped it. Paying the card’s bill afterwards is a separate transfer, from your bank account to the card. See "Card purchases vs. paying the bill".',
              },
              {
                question: 'I withdrew cash from an ATM',
                answer: 'That is a transfer - from your bank account to your cash account - not spending. The spending happens later, when the cash itself is used for something.',
              },
              {
                question: 'I made a mistake in an entry I already saved',
                answer: 'Open it from the Ledger and edit it. Correcting an entry is always safe - every figure built from it recalculates rather than carrying the old value forward.',
              },
            ],
          },
        ],
      },
    ],
    related: ['spending.card-purchases-vs-paying-the-bill', 'spending.categories-explained', 'today.real-balance'],
    seeInApp: [{ label: 'Open the Ledger', to: '/ledger' }],
  },
  {
    id: 'spending.card-purchases-vs-paying-the-bill',
    category: 'spending',
    slug: 'card-purchases-vs-paying-the-bill',
    title: 'Card purchases vs. paying the bill',
    summary: 'A card purchase is an expense the day you swipe it. Paying the card’s bill afterwards is a transfer. Recording both as expenses counts the same money twice.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'This is the single easiest way to double-count money in any finance app, so Kosh is strict about it: a credit card purchase is recorded as an Expense, on the day it happened. When you later pay the card’s bill from your bank account, that payment is a Transfer, not another expense - the spending already happened; this is just settling what you owe for it.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'Buying groceries on a credit card, then paying the bill',
            lines: [
              { label: '12 Sep - groceries on the card', value: 'Expense, ₹2,400, from the credit card' },
              { label: '3 Oct - paying the card bill', value: 'Transfer, ₹2,400, from bank to the credit card' },
            ],
            note: 'Recording the bill payment as an Expense as well would count the same ₹2,400 twice.',
          },
          {
            kind: 'prose',
            text: 'This is exactly what "money is never counted twice" means in practice, and it is enforced by how each entry is recorded, not by a warning after the fact - which is why choosing the right type when you record something matters.',
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
                question: 'What if I do not pay the full statement, just the minimum?',
                answer: 'Record the transfer for whatever amount you actually paid. What remains stays owed on the card, exactly as your statement shows.',
              },
            ],
          },
        ],
      },
    ],
    related: ['spending.recording-an-expense', 'cards.statements-and-paying'],
  },
  {
    id: 'spending.categories-explained',
    category: 'spending',
    slug: 'categories-explained',
    title: 'Categories, and why there is no budget',
    summary: 'A category groups similar spending so you can compare it to your own past, not so you can be held to a limit someone picked on a good day.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Every expense and income entry can carry a category - groceries, transport, salary, and so on. Kosh uses categories to group your income and flexible spending sensibly, not to set a limit for you to stay under.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'That is a deliberate choice, not a missing feature. A budget number picked on an optimistic day is easy to miss once, then easy to give up on entirely. Instead, once you have a few months of history, your flexible spending is shown against your own recent normal - a comparison that adjusts to how you actually live, rather than a target you set once and forgot why.',
          },
          {
            kind: 'example',
            title: 'Transport this month, against your own average',
            lines: [
              { label: 'Last 3 months, transport', value: '₹3,400 a month, on average' },
              { label: 'This month so far', value: '₹2,950' },
            ],
            note: 'Nothing here is a limit - it is a comparison, so a busier month than usual is shown plainly, not flagged.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'callout',
            tone: 'note',
            text: 'Categories carry a group behind the scenes - income, fixed, or flexible - which is what lets Months tell the difference between a bill you owe every month and money you choose to spend day to day.',
          },
        ],
      },
    ],
    related: ['spending.recording-an-expense', 'getting-started.what-kosh-wont-do'],
  },
  {
    id: 'spending.how-the-ledger-works',
    category: 'spending',
    slug: 'how-the-ledger-works',
    title: 'What goes in the Ledger',
    summary: 'One line for every time money actually moved, once each, on the day it moved - if it has not happened yet, it is not a Ledger entry.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'The Ledger is the full record everything else in Kosh is built from. If you just did one of these things, here is what to record.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Card swipe', means: 'Expense, on the day you swiped.', primer: true },
              { term: 'Card bill paid', means: 'Transfer — already counted at the swipe.', primer: true },
              { term: 'Cash withdrawn', means: 'Transfer — spent only when you spend it.', primer: true },
            ],
          },
          {
            kind: 'example',
            title: 'An EMI, recorded correctly',
            lines: [
              { label: '5 Oct - bike EMI', value: 'Expense, ₹6,145, category Loan EMI, from HDFC Salary' },
            ],
            note: 'One line, on the day it actually left - never a transfer to the loan, and never split into interest and principal here (that split lives on the loan’s own page).',
          },
          {
            kind: 'table',
            head: ['If you just did this…', 'Record'],
            rows: [
              ['Swiped a credit card', 'Expense, from the card, on the day you swiped - counted once, when you committed the money, not when the bill clears'],
              ['Paid the credit-card bill', 'Transfer, bank → card - the spending was already counted at each swipe, this only settles it'],
              ['Took cash out of an ATM', 'Transfer, bank → cash - you still have the money, it just moved, nothing has been spent yet'],
              ['Spent that cash', 'Expense, from Cash - this is the moment it actually left you'],
              ['Paid an EMI', 'Expense, category Loan EMI - the interest/principal split is computed on Debts from the loan schedule'],
              ['Salary landed', 'Income - money from outside, its category comes from the Income group'],
              ['Moved money to savings', 'Transfer - it is still yours, so it is neither income nor spending'],
              ['A SIP instalment went out', 'Investment - you still hold it, it leaves your spendable balance without being spent'],
              ['A shop refunded you', 'Refund, same category as the original - it reverses an expense rather than becoming new income'],
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
            text: 'A loan or investment account is never a spending account. A loan is a debt you owe, not a wallet you draw from, so it cannot be the source of an Expense, Income or Refund - only a Transfer (paying it down). The same goes for an investment account: money reaches it only as an Investment transfer, never as ordinary spending. Wrong: an Expense from "Education Loan" - a loan isn\'t something you spend from. Right: a Transfer from "HDFC Salary" to "Education Loan" - a prepayment, recorded correctly.',
          },
          {
            kind: 'callout',
            tone: 'note',
            text: 'Categories point one way: income categories (Salary, Freelance, Interest) are only for Income. Every other category is for spending - Expense and Refund both use them, because a refund reverses an earlier expense rather than becoming new income. Sub-categories are yours to make: put "Fuel" and "Cab" under "Transport" and you can record them separately while Transport stays one comparable line on Months.',
          },
          {
            kind: 'qa',
            items: [
              {
                question: 'A bill that is due but not yet paid - does it go in the Ledger?',
                answer: 'No. It lives on Months until you pay it, and becomes a Ledger entry the day it is actually paid.',
              },
              {
                question: 'Can I split an EMI into interest and principal myself?',
                answer: 'No - that split is computed on Debts from the loan’s own schedule, never typed. Record the EMI itself as one Expense.',
              },
              {
                question: 'A fund’s value went up - do I record that?',
                answer: 'No, that is a valuation, not money that moved. Add it on Investments instead.',
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
              { thing: 'A bill that is due but not yet paid', where: 'Months - it becomes a Ledger entry the day it is actually paid', to: '/month' },
              { thing: 'An EMI’s interest-vs-principal split', where: 'Debts - computed from the loan’s own schedule, never typed', to: '/money/debts' },
              { thing: 'A fund’s value going up or down', where: 'Investments - a valuation, not money that moved', to: '/money/investments' },
              { thing: 'An account’s opening balance', where: 'Accounts - set when you add the account', to: '/money/accounts' },
            ],
          },
        ],
      },
    ],
    related: ['spending.recording-an-expense', 'spending.card-purchases-vs-paying-the-bill'],
    seeInApp: [{ label: 'Open the Ledger', to: '/ledger' }],
  },
];
