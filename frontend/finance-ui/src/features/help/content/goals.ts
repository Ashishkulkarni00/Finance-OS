import type { DocTopic } from '../types';

/**
 * Goals & emergency fund - new in Phase B (IN_APP_MANUAL.md §8), including
 * `goals.how-goals-works`, the hub `GoalsGuideSheet`/`GoalsPrimer` render from after the
 * retrofit. Cover (insurance) has its own `cover` category (`content/cover.ts`) - it was
 * filed here first and moved out after review, since cover is protection, not saving, and
 * ADR-0016's "cover is never an asset" is exactly the confusion filing it under Goals
 * invited. Source: `features/plan/components/AddGoalSheet.tsx`, `GoalsSection.tsx`,
 * `GoalFunding.tsx`, `GoalsGuideSheet.tsx`.
 */
export const GOALS_TOPICS: DocTopic[] = [
  {
    id: 'goals.tracking-a-goal',
    category: 'goals',
    slug: 'tracking-a-goal',
    title: 'Tracking a goal',
    summary: 'A goal turns "I should save" into a number - a target, a date, and where the money that counts towards it actually sits.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A goal is a target amount by a date - an emergency fund, a trip, a deposit. What counts as "saved" comes from wherever you told the goal to look: an account, if you keep the money separately, or nothing, if you have not linked one yet.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'Linked to an account, a goal’s progress is simply that account’s balance - money in or out moves the goal automatically, with nothing to record twice.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'example',
            title: 'A trip goal, ₹35,000 saved of ₹80,000',
            lines: [
              { label: 'Saved', value: '₹35,000' },
              { label: 'Target', value: '₹80,000, by 15 Dec' },
              { label: 'Progress', value: '44%' },
              { label: 'A month', value: '₹11,250' },
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
                question: 'A trip in December, but bookings to pay in October',
                answer:
                  'Make the goal the whole trip, by the day you travel. On its page, add the bookings under Payments with their date and amount. The goal then says what you need by each date - the October bookings set the pace, not December - and the bookings show on Months in October, taken out of what’s free there.',
              },
              {
                question: 'Paying a booking made my goal go down?',
                answer:
                  'It doesn’t: progress counts what’s saved plus what the goal has already paid out, so money leaving for the trip still counts toward it.',
              },
              {
                question: 'Is a goal the same as a budget?',
                answer: 'No. A goal is money you’re putting aside for something. What you spend day to day is on Months.',
              },
            ],
          },
        ],
      },
    ],
    related: ['goals.adding-a-goal', 'goals.is-it-on-track', 'goals.the-emergency-fund'],
    seeInApp: [{ label: 'Open Ahead', to: '/ahead' }],
  },
  {
    id: 'goals.is-it-on-track',
    category: 'goals',
    slug: 'is-it-on-track',
    title: '"A month": is a goal on track?',
    summary: 'What is still left to save, divided by the whole months until the date - the honest cost of the target and date you set.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: '"A month" is what a goal needs from you each remaining month to reach its target by its date: the target minus what is already saved, divided by the whole months left. It is not shown in the final month, or once the date has passed - there is no month left to divide by.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'It recalculates every time you look, from whatever is actually saved right now - it is not a plan fixed on the day you created the goal.',
          },
          {
            kind: 'example',
            title: 'A trip goal, four months out',
            lines: [
              { label: 'Target', value: '₹80,000 by 15 Dec' },
              { label: 'Saved', value: '₹35,000' },
              { label: 'A month', value: '₹11,250' },
            ],
            note: '(₹80,000 − ₹35,000) ÷ 4 remaining months = ₹11,250 - recalculated fresh every time the goal is opened.',
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
                question: 'Why did "a month" go up?',
                answer:
                  'Either less went in than planned, or the date came closer with the same gap still to close. It’s the honest cost of the target and date you set — change either and it recalculates.',
              },
              {
                question: 'What should I track a goal in - a reservation or a separate account?',
                answer:
                  'A reservation is best when the money sits in an account you also use — it sets that amount aside, so it stops counting as spending money. A separate account works when the savings live on their own.',
              },
            ],
          },
        ],
      },
    ],
    related: ['goals.tracking-a-goal', 'goals.adding-a-goal'],
    seeInApp: [{ label: 'Open Ahead', to: '/ahead' }],
  },
  {
    id: 'goals.adding-a-goal',
    category: 'goals',
    slug: 'adding-a-goal',
    title: 'Adding a goal',
    summary: 'A target amount, a date, and - optionally - the account you are keeping it in.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Set a target and a date and Kosh works out honestly what it takes each month, rather than leaving "I should save more" as a feeling with no number attached.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            items: [
              { label: 'Goal', what: 'A name you will recognise.', example: 'Emergency fund, a trip, a deposit…', requirement: 'required' },
              { label: 'Target', what: 'The whole amount it will take. For a trip, the full trip - bookings and spending there together.', requirement: 'required' },
              { label: 'By when', what: 'When you need all of it. For a trip, the day you travel - anything due earlier is added as a payment on the goal’s own page.', requirement: 'required' },
              { label: 'Saved in', what: 'The account you are putting this money aside in - its balance is what counts as saved. Leave it empty if you are not keeping it separately.', requirement: 'optional' },
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
              'Open "Add a goal" from Ahead.',
              'Name it, and enter the full target amount and the date you need it by.',
              'If you are keeping the money in its own account, link it under "Saved in".',
              'Save. If it has payments due before its date - like a trip’s bookings - add those from the goal’s own page next.',
            ],
          },
        ],
      },
      {
        heading: 'After you save',
        blocks: [
          {
            kind: 'example',
            title: 'Setting up the emergency fund',
            lines: [
              { label: 'Goal', value: 'Emergency fund' },
              { label: 'Target', value: '₹2,00,000' },
              { label: 'By when', value: '31 Mar 2027 - a workable date, not a deadline' },
              { label: 'Saved in', value: 'HDFC Savings' },
            ],
            note: 'Every goal needs a date so Kosh can work out "a month" - for a fund like this, pick one that is comfortable rather than urgent; pushing it out later just recalculates the monthly figure.',
          },
          {
            kind: 'prose',
            text: 'The goal appears on Ahead with its progress and, once it can be worked out, what it needs from you each remaining month.',
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
                question: 'Can I change which account a goal is linked to later?',
                answer: 'Yes, a goal can move to another account. It cannot be unlinked back to "not kept separately" once linked.',
              },
              {
                question: 'The emergency fund is not really "for" anything - should I still make it a goal?',
                answer: 'Yes - see "The emergency fund" for why it deserves its own target even without a fixed date.',
              },
            ],
          },
        ],
      },
    ],
    related: ['goals.tracking-a-goal', 'goals.the-emergency-fund'],
    seeInApp: [{ label: 'Open Ahead', to: '/ahead' }],
  },
  {
    id: 'goals.the-emergency-fund',
    category: 'goals',
    slug: 'the-emergency-fund',
    title: 'The emergency fund',
    summary: 'Money set aside for when something goes wrong - kept out of what counts as spending money, so an ordinary month can never quietly use it up.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'An emergency fund is money set aside for the unplanned - a job gap, a medical bill, a repair. In Kosh it works exactly like any other goal: a target amount and a date. Because reaching and keeping it matters more than reaching it by a particular day, the date is worth picking as "comfortable" rather than "urgent" - it can always be pushed out later, which simply recalculates what a month needs to be.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'The reason it needs to be a goal (or a reservation) rather than just money sitting in a savings account is Reserved - the amount Free until salary takes off the top before anything else. Kept as plain savings without marking the account "No - savings" for spending purposes, it would quietly count as money you could spend today, which defeats the point of having it.',
          },
          {
            kind: 'example',
            title: 'An emergency fund of ₹2,00,000',
            lines: [
              { label: 'Held (bank + cash)', value: '₹2,68,400' },
              { label: '− Reserved (emergency fund)', value: '₹2,00,000' },
              { label: '= Left for everything else', value: '₹68,400' },
            ],
            note: 'The ₹2,00,000 is real money, sitting in a real account - it is simply never offered as part of what you could spend today.',
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
                question: 'My emergency fund is in a savings account - do I still need to do anything?',
                answer:
                  'Yes - mark that account "No - savings" (not spending money) when adding or editing it, or its whole balance still counts toward what you can spend. See "Adding an account".',
              },
              {
                question: 'How much should an emergency fund be?',
                answer: 'Kosh does not set a target for you - that is a personal number. What it does is keep whatever target you choose safely out of your day-to-day spending once you have set it as reserved.',
              },
            ],
          },
        ],
      },
    ],
    related: ['goals.tracking-a-goal', 'accounts.adding-an-account', 'today.real-balance'],
    seeInApp: [{ label: 'Open Ahead', to: '/ahead' }],
  },
  {
    id: 'goals.how-goals-works',
    category: 'goals',
    slug: 'how-goals-works',
    title: 'How Goals works',
    summary: 'What you’re saving towards and whether you’re on course. Every figure comes from real balances - nothing is assumed about what you’ll put in later.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Goals answers what you’re saving towards and whether you’re on course. Every figure comes from real balances — nothing is assumed about what you’ll put in later.',
          },
          {
            kind: 'terms',
            items: [
              { term: 'Saved', means: 'What’s currently in the account or reservation you linked the goal to.', primer: true },
              { term: 'Target', means: 'How much you want, and the date you want it by.' },
              {
                term: 'A month',
                means:
                  'What’s still left to save, divided by the whole months until the date. Not shown in the final month or once the date has passed — there’s no month left to divide by.',
                primer: true,
              },
              { term: 'Progress', means: 'Saved as a share of the target.', primer: true },
            ],
          },
          {
            kind: 'example',
            title: 'Saved against target',
            lines: [
              { label: 'Saved', value: '₹35,000' },
              { label: 'Target', value: '₹80,000' },
              { label: 'Progress', value: '44%' },
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
                question: 'How does a goal know how much I’ve saved?',
                answer:
                  'From what you chose under “Saved in”. Linked to an account, saved is that account’s balance — money in or out moves the goal. Linked to a reservation, saved is the amount reserved — raise the reservation and the goal moves. A goal linked to nothing stays at zero.',
              },
              {
                question: 'What should I track a goal in?',
                answer:
                  'A reservation is best when the money sits in an account you also use — it sets that amount aside, so it stops counting as spending money. A separate account works when the savings live on their own.',
              },
              {
                question: 'Why did “a month” go up?',
                answer:
                  'Either less went in than planned, or the date came closer with the same gap still to close. It’s the honest cost of the target and date you set — change either and it recalculates.',
              },
              {
                question: 'A trip in December, but bookings to pay in October',
                answer:
                  'Make the goal the whole trip, by the day you travel. On its page, add the bookings under Payments with their date and amount. The goal then says what you need by each date - the October bookings set the pace, not December - and the bookings show on Months in October, taken out of what’s free there. The rest is due on the trip date; plan it as a payment too if you want December set aside for it.',
              },
              {
                question: 'Paying a booking made my goal go down?',
                answer:
                  'It doesn’t: progress counts what’s saved plus what the goal has already paid out, so money leaving for the trip still counts toward it.',
              },
              {
                question: 'Is a goal the same as a budget?',
                answer: 'No. A goal is money you’re putting aside for something. What you spend day to day is on Months.',
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
              { thing: 'Setting money aside inside an account', where: 'Accounts', to: '/money/accounts' },
              { thing: 'Recurring bills and what’s due this cycle', where: 'Months', to: '/month' },
              { thing: 'Investments you’re building up', where: 'Investments', to: '/money/investments' },
            ],
          },
        ],
      },
    ],
    related: ['goals.tracking-a-goal', 'goals.is-it-on-track', 'goals.adding-a-goal'],
    seeInApp: [{ label: 'Open Ahead', to: '/ahead' }],
  },
];
