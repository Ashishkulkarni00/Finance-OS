/**
 * `Modal` is now `Sheet` (UI_UX_REVAMP_PLAN Phase 2): same props, native `<dialog>` underneath.
 * The alias keeps the ~25 existing call sites unchanged; new code should import `Sheet`.
 */
export { Sheet as Modal } from './Sheet';
