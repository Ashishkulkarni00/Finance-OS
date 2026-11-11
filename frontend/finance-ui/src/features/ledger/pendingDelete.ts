import type { AppDispatch, RootState } from '@/store';
import { transactionService } from '@/services/transactionService';
import {
  deleteCancelled,
  deleteCleared,
  deleteDone,
  deleteFailed,
  deleteQueued,
  deleteSending,
} from '@/store/slices/uiSlice';

/**
 * Deleting a transaction safely (UI_UX_REVAMP_PLAN 6.6).
 *
 * <p>The server has `DELETE /transactions/{id}` and no way back from it, so undo is only
 * possible **before the request is sent**. Hence a short window: the entry stays visible (dimmed,
 * not hidden - the server's day subtotals still include it, and a list that disagreed with its own
 * totals would be a lie), a toast offers Undo, and only when the window closes is the request sent.
 * "Deleted" is claimed only after the server answers 2xx.
 *
 * <p>The timers live here, outside React, so they survive navigation: moving from the Ledger to
 * Today inside the window neither cancels the delete nor starts a second one. A second request for
 * the same entry is refused while one is pending, and the mutation carries a fixed cache key.
 *
 * <p>Closing the tab inside the window cancels the delete: the timer simply dies with the page and
 * nothing was sent, so nothing false was ever said and the entry is still there. A leave prompt
 * warns while one is pending or in flight. (A request already in flight may or may not finish; the
 * list shows the truth on the next load either way.)
 */
export const UNDO_WINDOW_MS = 6000;
/** How long "Entry deleted." stays up, and how long the row stays hidden meanwhile. */
const DONE_NOTICE_MS = 5000;

const timers = new Map<number, number>();

function leaveWarning(e: BeforeUnloadEvent) {
  e.preventDefault();
}
let guarded = false;

/** Warn before leaving while anything is pending or in flight; stop warning once nothing is. */
function syncLeaveGuard(getState: () => RootState) {
  const active = Object.values(getState().ui.pendingDeletes).some((p) => p.phase === 'pending' || p.phase === 'sending');
  if (active && !guarded) {
    window.addEventListener('beforeunload', leaveWarning);
    guarded = true;
  } else if (!active && guarded) {
    window.removeEventListener('beforeunload', leaveWarning);
    guarded = false;
  }
}

export const requestDelete =
  (tx: { id: number; description: string }) =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    const { id, description } = tx;
    // Single flight: a second click, a double tap, or the same entry from another page does nothing.
    if (getState().ui.pendingDeletes[id]) return;
    if (getState().connectivity.offline) {
      dispatch(
        deleteFailed({
          id,
          description,
          message: "Can't delete while the server can't be reached. The entry is still in your records.",
        }),
      );
      return;
    }
    dispatch(deleteQueued({ id, description, deadline: Date.now() + UNDO_WINDOW_MS }));
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id);
        void dispatch(sendDelete(id));
      }, UNDO_WINDOW_MS),
    );
    syncLeaveGuard(getState);
  };

export const undoDelete =
  (id: number) =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    const timer = timers.get(id);
    if (timer == null) return; // too late: it is already on its way
    window.clearTimeout(timer);
    timers.delete(id);
    dispatch(deleteCancelled(id));
    syncLeaveGuard(getState);
  };

export const sendDelete =
  (id: number) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    const entry = getState().ui.pendingDeletes[id];
    if (!entry || entry.phase === 'sending' || entry.phase === 'deleted') return;
    dispatch(deleteSending(id));
    syncLeaveGuard(getState);
    try {
      // No optimistic cache edit: the lists and every figure refetch from the server through the
      // mutation's own tag invalidation, after the server has answered.
      await dispatch(transactionService.endpoints.deleteTransaction.initiate(id, { fixedCacheKey: `delete-${id}` })).unwrap();
      dispatch(deleteDone({ id, alreadyGone: false }));
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 404) {
        dispatch(deleteDone({ id, alreadyGone: true }));
      } else {
        dispatch(
          deleteFailed({
            id,
            description: entry.description,
            message: e.message ?? "Couldn't delete this entry. It's still in your records.",
          }),
        );
        syncLeaveGuard(getState);
        return;
      }
    }
    syncLeaveGuard(getState);
    window.setTimeout(() => dispatch(deleteCleared(id)), DONE_NOTICE_MS);
  };

/** Dismiss a failed delete's notice without retrying. */
export const dismissDelete =
  (id: number) =>
  (dispatch: AppDispatch): void => {
    dispatch(deleteCleared(id));
  };
