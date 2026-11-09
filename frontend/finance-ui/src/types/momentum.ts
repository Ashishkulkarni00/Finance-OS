/** ROADMAP 6.3 — which way things are moving. Named directions with reasons; never a score. */
export interface MomentumItem {
  key: string;
  name: string;
  direction: 'BETTER' | 'WORSE' | 'STEADY' | 'UNKNOWN';
  headline: string;
  reason: string | null;
}
