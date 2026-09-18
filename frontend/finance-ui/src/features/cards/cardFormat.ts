import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import type { CardNetwork, CreditCardResponse } from '@/types/card';

export const CARD_NETWORKS: { value: CardNetwork; label: string }[] = [
  { value: 'VISA', label: 'Visa' },
  { value: 'MASTERCARD', label: 'Mastercard' },
  { value: 'RUPAY', label: 'RuPay' },
  { value: 'AMEX', label: 'American Express' },
  { value: 'DINERS', label: 'Diners Club' },
  { value: 'OTHER', label: 'Other' },
];

export function networkLabel(network: CardNetwork | null | undefined): string | null {
  return network ? (CARD_NETWORKS.find((n) => n.value === network)?.label ?? null) : null;
}

/** 1 → "1st", 22 → "22nd". */
export function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

/** "HDFC · •• 4321 · Visa" - whatever of the three is known. */
export function cardIdentity(card: { institution?: string | null; lastFour?: string | null; network?: CardNetwork | null }): string {
  return [card.institution, card.lastFour ? `•• ${card.lastFour}` : null, networkLabel(card.network)].filter(Boolean).join(' · ');
}

const PERCENT = new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 0 });

/** A server-computed fraction as a percentage. A ratio, not money. */
export function formatShare(fraction: number | null | undefined): string | null {
  return fraction == null ? null : PERCENT.format(Number(fraction));
}

export type BillTone = 'neutral' | 'positive' | 'attention' | 'critical';

export const TONE_CLASS: Record<BillTone, string> = {
  neutral: 'text-ink-muted',
  positive: 'text-positive',
  attention: 'text-attention',
  critical: 'text-critical',
};

/** The one line that says where a card's bill stands. */
export function billLine(card: CreditCardResponse): { text: string; tone: BillTone } {
  if (!card.setUp) return { text: 'Finish setting up - limit, statement day and due day', tone: 'attention' };
  const s = card.latestStatement;
  if (s?.status === 'OVERDUE') return { text: `${formatMoney(s.remaining)} overdue since ${formatShortDate(s.dueDate)}`, tone: 'critical' };
  if (s?.status === 'DUE') return { text: `${formatMoney(s.remaining)} to pay by ${formatShortDate(s.dueDate)}`, tone: 'attention' };
  const next = card.nextStatementDate ? formatShortDate(card.nextStatementDate) : null;
  if (s) return { text: next ? `Last bill paid · next statement ${next}` : 'Last bill paid', tone: 'positive' };
  return { text: next ? `No statement recorded yet · next one ${next}` : 'No statement recorded yet', tone: 'neutral' };
}
