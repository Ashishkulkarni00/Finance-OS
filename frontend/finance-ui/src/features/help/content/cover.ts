import type { DocTopic } from '../types';

/**
 * Cover - new category (revised after Phase B review: Cover was first filed under
 * `goals`, which was the wrong call - cover is protection, not saving, and ADR-0016's
 * "cover is never an asset" is exactly the confusion filing it under Goals invited).
 * Cover is its own nav tab in the app (`/money/cover`), so it is its own category here.
 *
 * Source: `features/cover/components/CoverStanding.tsx`, `PolicyRow.tsx`, `PolicySheet.tsx`.
 */
export const COVER_TOPICS: DocTopic[] = [
  {
    id: 'cover.what-cover-is',
    category: 'cover',
    slug: 'what-cover-is',
    title: 'Cover: insurance is never an asset',
    summary: 'What you would not have to find yourself if something happened - shown on its own, and never added to what you own.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'Cover records what you are insured for - health, life, motor, home - so you can see it all in one place: what each policy covers, what it costs, and when it renews.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'prose',
            text: 'The screen totals every policy’s cover amount into one "Covered for" figure, across however many policies you have, beside a separate "Costs you" figure - what all the premiums together come to in a month. Neither figure is ever added to net worth: cover is money you would not have to find yourself, not money you have.',
          },
          {
            kind: 'example',
            title: 'Two policies, one figure each',
            lines: [
              { label: 'Health cover', value: '₹5,00,000' },
              { label: 'Term life cover', value: '₹1,00,00,000' },
              { label: 'Covered for (2 policies)', value: '₹1,05,00,000' },
              { label: 'Net worth', value: 'unchanged either way' },
            ],
            note: 'The ₹1,05,00,000 is what insurers would pay out between the two policies, not money sitting anywhere - it never appears in net worth, and it is not a pot you could draw from for anything else.',
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
                question: 'Why doesn’t cover show up in net worth?',
                answer:
                  'Cover is not money you have - it is money you would not have to find if something happened. It is shown on its own, never summed with what you own or owe (ADR-0016).',
              },
              {
                question: 'I know I am covered but cannot remember for how much',
                answer:
                  'Save the policy anyway with the amount blank. "I’m covered but I can’t remember for how much" is a true state, and refusing the record until every box is filled would lose the fact that cover exists at all.',
              },
              {
                question: 'I deleted a policy that has a loan repaying its premium - does the loan go too?',
                answer: 'No - the record of being covered goes, but the loan stays. That debt is real either way.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cover.premium-and-renewal', 'cover.adding-a-policy', 'accounts.net-worth'],
    seeInApp: [{ label: 'Open Cover', to: '/money/cover' }],
  },
  {
    id: 'cover.premium-and-renewal',
    category: 'cover',
    slug: 'premium-and-renewal',
    title: 'Premium and renewal',
    summary: 'Whatever you actually pay - yearly, monthly, or once - shown as one comparable "a month" figure, and a renewal date said the way you would say it out loud.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: 'A premium can be paid every year, every six months, every quarter, every month, or just once. Whatever the frequency, "Costs you" on the Cover screen shows it spread over a month, so every policy is comparable on the same footing.',
          },
        ],
      },
      {
        heading: 'Why use it?',
        blocks: [
          {
            kind: 'example',
            title: 'An annual premium, spread over the year',
            lines: [
              { label: 'Premium', value: '₹47,976' },
              { label: 'Paid', value: 'Every year' },
              { label: 'Shown as', value: '₹3,998 a month' },
            ],
            note: '₹47,976 ÷ 12 = ₹3,998 - the same policy, read as a monthly cost rather than one large yearly one.',
          },
        ],
      },
      {
        heading: 'How this helps',
        blocks: [
          {
            kind: 'prose',
            text: 'Renewal is shown as days where that is the more useful read - "in 11 days" is a decision, "7 Oct 2026" needs mental arithmetic first, the same rule the plan’s due dates follow. Further out, it switches to a plain date. If a policy has lapsed, it says how many days ago; if no renewal date was ever recorded, it says that plainly instead of guessing one.',
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
                question: 'Why does it say "in 11 days" instead of a date?',
                answer: 'Inside 60 days, a day count is what you would actually act on. Past that, the exact date is more useful, so it switches over.',
              },
              {
                question: 'A policy shows "no renewal date recorded" - is that a problem?',
                answer: 'No - it means that date was never entered. Cover is never removed or estimated for it; add the date from the sheet whenever you have it.',
              },
              {
                question: '"Costs you" shows nothing for one policy - why?',
                answer: 'Its premium was never recorded. That is shown as unknown, not as ₹0 - a premium that has not been entered still costs something, and ₹0 would quietly understate the monthly picture.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cover.what-cover-is', 'cover.adding-a-policy'],
    seeInApp: [{ label: 'Open Cover', to: '/money/cover' }],
  },
  {
    id: 'cover.adding-a-policy',
    category: 'cover',
    slug: 'adding-a-policy',
    title: 'Adding cover',
    summary: 'Only a name and what it covers are required - everything else, including the amount, can stay blank rather than block the record.',
    sections: [
      {
        heading: 'What is this?',
        blocks: [
          {
            kind: 'prose',
            text: '"Add cover" records a policy - health, life, motor, home or other - with as much or as little detail as you actually have to hand.',
          },
        ],
      },
      {
        heading: 'What do I enter?',
        blocks: [
          {
            kind: 'fields',
            intro: '"Add cover".',
            items: [
              { label: 'What', what: 'A name you will recognise.', example: 'Mom’s health cover, term life…', requirement: 'required' },
              { label: 'Covers', what: 'Health, Life, Motor, Home, or Other.', requirement: 'required' },
              { label: 'Who', what: 'Whose cover this is.', example: 'Mom, me and Priya…', requirement: 'optional' },
              { label: 'Cover for', what: 'What you would get back. Never counted as money you have.', requirement: 'optional' },
              { label: 'Premium', what: 'What it costs. Leave blank if someone else pays it - an employer policy still has cover.', requirement: 'optional' },
              { label: 'Paid', what: 'How often the premium is paid. Only shown once a premium is entered.', requirement: 'optional' },
              { label: 'Renews on', what: 'When cover lapses if nothing is done - the date that actually matters.', requirement: 'optional' },
              { label: 'Insurer', what: 'Who the policy is with.', requirement: 'optional' },
              { label: 'Policy no.', what: 'Last four digits only. The full number is never stored.', requirement: 'optional' },
              { label: 'Paid off as', what: 'If you financed the premium on a card in instalments, the loan that is repaying it. The debt stays a debt either way.', requirement: 'optional' },
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
              'Open "Add cover" from the Cover tab.',
              'Name it and choose what it covers.',
              'Enter the cover amount and premium if you know them - both can be left blank.',
              'Add the renewal date if there is one, so Kosh can warn you before it lapses.',
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
            title: 'Adding a health policy with only what you know',
            lines: [
              { label: 'What', value: 'Mom’s health cover' },
              { label: 'Covers', value: 'Health' },
              { label: 'Cover for', value: 'not entered' },
              { label: 'Premium', value: 'not entered' },
            ],
            note: 'Saved as-is: the policy shows up on Cover as covered, with the amount and cost both plainly marked unknown rather than guessed.',
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
                question: 'I financed the premium on a card in instalments - is that a loan?',
                answer: 'Yes - link it under "Paid off as" if you have already added that loan. The premium debt is real and stays tracked as a loan; the cover itself is tracked separately.',
              },
              {
                question: 'Can I delete a policy?',
                answer: 'Yes, from its own edit sheet. Deleting removes the record of being covered; any loan repaying its premium is not affected.',
              },
            ],
          },
        ],
      },
    ],
    related: ['cover.what-cover-is', 'cover.premium-and-renewal'],
    seeInApp: [{ label: 'Open Cover', to: '/money/cover' }],
  },
];
