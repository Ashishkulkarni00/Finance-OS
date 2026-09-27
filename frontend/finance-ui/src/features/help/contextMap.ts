import type { DocTopicId } from './types';

/**
 * `data-doc` key -> topic id. IN_APP_MANUAL.md §4's table, verbatim.
 *
 * <p>A tag names a stable product concept ("loan.emi"), never a topic id directly, so
 * the topic behind it can be re-pointed later without touching the component that
 * carries the tag. Phase A only wrote content for six categories (see
 * `content/index.ts`'s `CATEGORIES`), but every key below is mapped regardless of
 * phase - most just resolve to a Phase B topic that does not exist as content yet.
 * `resolveDocKey` below is what stays honest about that gap.
 */
export const CONTEXT_MAP: Record<string, DocTopicId> = {
  'position.real-balance': 'today.real-balance',
  'position.room': 'today.room',
  'insight.item': 'attention.what-needs-you',
  'month.shape': 'months.the-month-line',
  'month.plan-row': 'monthly-plan.settling-a-bill',
  'month.close': 'months.closing-a-month',
  'loan.card': 'loans.understanding-a-loan',
  'loan.emi': 'loans.what-an-emi-is',
  'loan.outstanding': 'loans.outstanding-vs-remaining',
  'card.statement': 'cards.statements-and-paying',
  'card.available': 'cards.available-credit',
  'card.limit': 'cards.available-credit',
  'card.due-date': 'cards.statements-and-paying',
  'goal.card': 'goals.tracking-a-goal',
  'goal.pace': 'goals.is-it-on-track',
  'investment.row': 'investments.sips-and-rds',
  'investment.gain': 'investments.sips-and-rds',
  'account.balance': 'accounts.balance-vs-available',
  'networth.total': 'accounts.net-worth',
  'cover.policy': 'cover.what-cover-is',
  'cover.premium': 'cover.premium-and-renewal',
  'cover.renewal': 'cover.premium-and-renewal',
  'attention.overdue': 'attention.overdue-and-what-to-do',
  'ledger.row': 'spending.how-the-ledger-works',
  // Today's own derivation lines (spec §4 sweep) - "Where you stand"'s Held/Reserved/
  // Committed/Owed-on-cards all point back at the one table that already defines every
  // one of those terms together; the three summary rows below it each get their own
  // topic, since they each answer a genuinely different question.
  'position.held': 'today.real-balance',
  'position.reserved': 'today.real-balance',
  'position.committed': 'today.real-balance',
  'position.owed-cards': 'today.real-balance',
  'today.free-this-month': 'today.free-this-month',
  'today.runway': 'today.if-income-stopped',
  'today.owed': 'today.owed-across-loans',
  'today.net-worth-row': 'accounts.net-worth',
  'today.needs-you-count': 'attention.what-needs-you',
  // Months' month-line terms and Month Close's five steps.
  'month.comes-in': 'months.the-month-line',
  'month.committed': 'months.the-month-line',
  'month.set-aside': 'months.the-month-line',
  'month.flexible': 'months.the-month-line',
  'month.close.confirm': 'months.closing-a-month',
  'month.close.resolve': 'months.closing-a-month',
  'month.close.review': 'months.closing-a-month',
  'month.close.moved': 'months.closing-a-month',
  'month.close.close': 'months.closing-a-month',
  // Cards' unbilled figure.
  'card.unbilled': 'cards.statements-and-paying',
  // A goal's payment schedule line.
  'goal.schedule-line': 'goals.tracking-a-goal',
  // Ledger row fields, more precise than the whole-row `ledger.row`.
  'ledger.category': 'spending.categories-explained',
  'ledger.account': 'accounts.balance-vs-available',
  // Phase B (IN_APP_MANUAL.md §4 "Coverage") - the 18 forms, tagged on their sheet's title bar.
  'commitment.form': 'monthly-plan.adding-a-commitment',
  'commitment.settle-form': 'monthly-plan.settling-a-bill',
  'loan.form': 'loans.adding-a-loan',
  'account.form': 'accounts.adding-an-account',
  'account.update-balance-form': 'accounts.updating-a-balance',
  'transaction.form': 'spending.recording-an-expense',
  'card.form': 'cards.adding-a-card',
  'card.statement-form': 'cards.statements-and-paying',
  'goal.form': 'goals.adding-a-goal',
  'investment.form': 'investments.adding-an-investment',
  'cover.form': 'cover.adding-a-policy',
};

/**
 * Resolves a `data-doc` key to the topic id it should open. An unmapped key warns in
 * development and does nothing in production - it never falls back to a generic topic
 * (§4: "avoid showing the same generic documentation link everywhere").
 */
export function resolveDocKey(key: string): DocTopicId | undefined {
  const topicId = CONTEXT_MAP[key];
  if (!topicId) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[help] "${key}" has no entry in CONTEXT_MAP - add one in features/help/contextMap.ts.`);
    }
    return undefined;
  }
  return topicId;
}
