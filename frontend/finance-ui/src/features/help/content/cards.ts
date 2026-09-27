import type { DocTopic } from '../types';

/**
 * Credit cards - new in Phase B (IN_APP_MANUAL.md §8). Cards has no guide sheet or
 * primer of its own (only the seven listed in §1 do), so this category has no retrofit
 * hub - it is written straight for the manual. Source: `routes/CardsPage.tsx`,
 * `features/cards/components/CreditCardSheet.tsx`, `RecordStatementSheet.tsx` and
 * `cardFormat.ts`.
 */
export const CARDS_TOPICS: DocTopic[] = [
  {
    id: 'cards.a-credit-card-is-its-own-account',
    category: 'cards',
    slug: 'a-credit-card-is-its-own-account',
    title: 'A credit card is its own account',
    summary: 'Not linked to a bank account - what you spend on it is owed until you pay the bill, and that bill is a transfer, never a second expense.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A credit card in Kosh is its own account, separate from any bank account. A swipe is recorded as an Expense on the card, on the day it happens - what you owe on it is already taken out of what is free this month, before the bill even arrives.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Paying the card’s bill afterwards is a Transfer, from a bank account to the card - never a second expense. The spending already counted at the swipe; paying the bill only settles what is owed for it.',
          },
          {
            kind: 'example',
            title: 'Groceries on a credit card, then paying the bill',
            lines: [
              { label: '12 Sep - groceries', value: 'Expense, ₹3,200, from the card' },
              { label: '3 Oct - pay the bill', value: 'Transfer, ₹3,200, bank → card' },
            ],
            note: 'Recording the bill payment as an Expense as well would count the same ₹3,200 twice.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'A debit card works completely differently and is not its own account at all: it spends straight from the bank account it is linked to, and has no balance of its own. Record a debit card spend as an Expense from that bank account, the same as cash.',
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
                question: 'I paid off my card bill in full - why does the card still show something owed?',
                answer:
                  'Check the payment was recorded as a Transfer into the card account, for the full amount. If it was recorded as an Expense instead, it never reduced what the card owes.',
              },
              {
                question: 'Do I need to record a debit card purchase differently from cash?',
                answer: 'No - both are an Expense from the bank account (or cash) the money actually left.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cards.statements-and-paying', 'cards.available-credit', 'spending.card-purchases-vs-paying-the-bill'],
    seeInApp: [{ label: 'Open Cards', to: '/money/cards' }],
  },
  {
    id: 'cards.statements-and-paying',
    category: 'cards',
    slug: 'statements-and-paying',
    title: 'Statements, and paying a bill',
    summary: 'A statement fixes the total and minimum due for one billing cycle. Recording it lets Kosh tell you exactly what a bill still needs.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Each month, a card generates a statement on its statement day, and the bill it describes is due by its due day. Recording the statement in Kosh is what turns "owed on the card" into a specific bill with a total, a minimum, and a due date.',
          },
          {
            kind: 'terms',
            items: [
              {
                term: 'Spent since the statement',
                means: 'Swipes after the last statement date, not yet on any bill - "unbilled". It still counts in what the card owes overall; it just isn’t due yet.',
              },
            ],
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: '"Record statement" - the bank’s own figures, with what Kosh can work out already filled in.',
            items: [
              { label: 'Statement', what: 'The statement or billing date printed on the statement.', requirement: 'required' },
              { label: 'Due by', what: 'The payment due date. Filled in from the card’s due day.', requirement: 'auto' },
              { label: 'Total due', what: 'The total amount due. Filled in from what you have entered on this card, if the card was tracked from before that date.', requirement: 'auto' },
              { label: 'Minimum', what: 'The minimum amount due printed on the statement.', requirement: 'required' },
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
              'Open "Record statement" on the card.',
              'Check the statement and due dates, which are worked out from the card’s billing cycle.',
              'Compare the pre-filled total against your bank’s figure - if the bank’s is different, use theirs; a difference usually means a spend on this card isn’t in your Ledger yet.',
              'Enter the minimum due, and save.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'prose',
            text: 'Once recorded, the statement’s total appears under "Bills to pay" on Cards. Pay it the same way you pay any card bill - a Transfer from the bank account it leaves from, for whatever amount you actually pay.',
          },
          {
            kind: 'example',
            title: 'Between two statements',
            lines: [
              { label: 'Statement total (billed)', value: '₹8,450' },
              { label: 'Spent since the statement', value: '₹1,320' },
              { label: 'Owed on the card overall', value: '₹9,770' },
            ],
            note: 'The ₹1,320 has no due date yet - it will appear on next month’s statement - but it already counts in what the card owes today.',
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
                question: 'What is "Spent since the statement"?',
                answer:
                  'Swipes on the card after its last statement date that have not appeared on a bill yet - the unbilled amount. It still counts toward what the card owes and toward Owed on cards on Today; it is simply not due until the next statement.',
              },
              {
                question: 'What if I only pay the minimum?',
                answer: 'Record the transfer for whatever you actually paid. What remains stays owed on the card, exactly as your statement shows.',
              },
              {
                question: 'The pre-filled total can’t be worked out',
                answer: 'This happens when the card is tracked from a date after the statement began - copy the total straight from the statement instead.',
              },
              {
                question: 'A statement for this date is already recorded',
                answer: 'Delete the existing one from the card’s statements before recording it again.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cards.a-credit-card-is-its-own-account', 'cards.available-credit'],
    seeInApp: [{ label: 'Open Cards', to: '/money/cards' }],
  },
  {
    id: 'cards.available-credit',
    category: 'cards',
    slug: 'available-credit',
    title: 'Available credit',
    summary: 'Limit minus what is owed minus principal already blocked for card EMIs - lower than a simple limit-minus-outstanding sum.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Available credit is how much more you could put on the card right now. It starts from the card’s limit, takes away everything currently owed on it, and also takes away the principal of any EMI charged to the card that is still to be repaid.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'A card with an EMI on it',
            lines: [
              { label: 'Limit', value: '₹1,50,000' },
              { label: 'Owed (statement + unbilled)', value: '₹22,400' },
              { label: 'EMI principal still blocked', value: '₹18,000' },
              { label: 'Available', value: '₹1,09,600' },
            ],
            note: 'A bank usually blocks the remaining EMI principal against the limit for the life of the EMI, which is why Available is lower than Limit minus Owed alone.',
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
                question: 'My available credit looks lower than limit minus what I owe',
                answer:
                  'That is expected once an EMI is charged to the card - the remaining principal on it is blocked against the limit until the EMI finishes, on top of whatever is currently billed or unbilled.',
              },
              {
                question: '"Credit available" on the Cards summary looks different from one card’s own figure',
                answer: 'The summary adds available credit across every credit card - open the card itself for its own limit and figure.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cards.a-credit-card-is-its-own-account', 'cards.statements-and-paying'],
    seeInApp: [{ label: 'Open Cards', to: '/money/cards' }],
  },
  {
    id: 'cards.adding-a-card',
    category: 'cards',
    slug: 'adding-a-card',
    title: 'Adding a card',
    summary: 'A credit card needs its limit and billing cycle to work at all - a debit card just needs the bank account it spends from.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Credit and debit cards are added from different, much shorter forms, because they track completely different things: a credit card is a new account with a limit and a billing cycle; a debit card is just a label on a bank account you already have.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: '"Add a credit card".',
            items: [
              { label: 'Card', what: 'A name you will recognise.', example: 'HDFC Millennia', requirement: 'required' },
              { label: 'Bank', what: 'The bank that issued the card.', requirement: 'optional' },
              { label: 'Last 4', what: 'Only the last 4 digits printed on the card - never the full number.', requirement: 'optional' },
              { label: 'Network', what: 'The scheme printed on the card, like Visa or RuPay.', requirement: 'optional' },
              { label: 'Credit limit', what: 'The total limit shown in your card app or on the statement.', requirement: 'required' },
              { label: 'Statement', what: 'The day of the month your statement is generated.', requirement: 'required' },
              { label: 'Bill due', what: 'The day of the month the bill must be paid by.', requirement: 'required' },
              { label: 'Paid from', what: 'The bank account you usually pay this bill from - it only pre-fills "Pay bill", it does not link the accounts.', requirement: 'optional' },
              { label: 'Owed today', what: 'Everything owed on the card right now, billed and unbilled, from your card app. Only asked when adding, not when editing.', requirement: 'optional' },
              { label: 'As of', what: 'The date that owed amount is from.', requirement: 'optional' },
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
              'From Cards, choose "Credit card" or "Debit card".',
              'For a credit card, name it and enter the limit, statement day and bill due day.',
              'Enter what is currently owed on it, if anything, and the date that figure is from.',
              'For a debit card, just name it and choose the bank account it spends from.',
              'Save.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'example',
            title: 'Adding a Millennia card',
            lines: [
              { label: 'Credit limit', value: '₹1,50,000' },
              { label: 'Statement', value: '15th' },
              { label: 'Bill due', value: '5th (following month)' },
              { label: 'Owed today', value: '₹0' },
            ],
            note: 'Saved with nothing owed yet, the card appears on Cards with full available credit - ₹1,50,000 - and is ready to record swipes against.',
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
                question: 'Do I need to add a debit card to record spending with it?',
                answer: 'No - a debit card spend is recorded as an Expense from the bank account directly. Adding the card itself is only for keeping track of which physical cards reach which account.',
              },
              {
                question: 'The bill due day is before the statement day',
                answer: 'That is normal when the due date falls in the following month - Kosh shows it as "due the following month" once both days are entered.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cards.a-credit-card-is-its-own-account', 'cards.available-credit'],
    seeInApp: [{ label: 'Open Cards', to: '/money/cards' }],
  },
];
