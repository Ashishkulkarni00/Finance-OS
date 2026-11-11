import { useGetAllInsightsQuery } from '@/services/insightService';

/**
 * How many things deserve a badge on the nav (UI_UX_REVAMP_PLAN §6.5): CRITICAL and ATTENTION
 * only. Informational items live in Needs you but never badge - a badge that is always on is
 * one the user learns to ignore, and then it cannot warn them when it matters.
 *
 * <p>Not `financial-state.attentionCount`: that counts every insight, informational ones too.
 * Read from the same cache Needs you uses, so it is one request and the two always agree.
 */
export function useAttentionBadge(): number {
  const { data } = useGetAllInsightsQuery();
  return (data?.items ?? []).filter((i) => i.severity === 'CRITICAL' || i.severity === 'ATTENTION').length;
}
