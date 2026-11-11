/**
 * Release gates (UI_UX_REVAMP_PLAN Part 11). A gate is a thing that is built but must not be
 * offered until something outside the UI is verified.
 *
 * <p><strong>MONTH_CLOSE_ENABLED - gate G1.</strong> Closing a month writes an immutable
 * `CycleSnapshot` (ADR-0011), so a wrong figure written by the first close is wrong forever and no
 * screen can repair it. `FIX_BACKLOG` 1.15 (income counted as commitments in `PlanAdherence`) is
 * fixed in code but has no recorded runtime verification. Until the user has (a) restarted the
 * backend on a build that includes it, (b) seen a read-only `GET /review/months` that excludes
 * income from commitments planned/kept, and (c) explicitly approved the first real close, the
 * Month page does not offer "Close this month".
 *
 * <p>Flip this to `true` only as the last step of G1. It hides the prompt, not the route:
 * `/month/close` still exists so the flow can be exercised once the gate opens.
 */
export const MONTH_CLOSE_ENABLED = false;
