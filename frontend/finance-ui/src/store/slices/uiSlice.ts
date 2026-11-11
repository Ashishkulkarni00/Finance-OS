import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { WriteEffect } from '@/types/effect';

/** Values "Add" opens with when the screen it's opened from already knows them - e.g.
 *  "Pay bill" on a card knows it's a transfer, how much, and to which card. */
export interface AddSheetPrefill {
  type?: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT' | 'REFUND';
  amount?: string;
  accountId?: number;
  toAccountId?: number | null;
  description?: string;
  date?: string;
}

/** Things the rail's Add can open besides a transaction - see `addTargetFor`. */
export type PageAddKind = 'bill' | 'account' | 'card' | 'loan' | 'holding' | 'goal';

/** One effect waiting to be read, with an id so several can queue without colliding. */
export interface EffectToast {
  id: number;
  effect: WriteEffect;
}

/**
 * One transaction delete on its way to the server (UI_UX_REVAMP_PLAN 6.6).
 *
 * <pre>
 * pending (undoable) -> sending -> deleted     the server said so; only now is "deleted" claimed
 *        |                  \-> failed         the entry is still in the records; Retry offered
 *      undo -> (entry removed from this map, nothing was ever sent)
 * </pre>
 *
 * Kept in the store, not in a component, so the window survives navigation: leaving the page
 * must neither cancel the delete nor start a second one.
 */
export interface PendingDelete {
  phase: 'pending' | 'sending' | 'failed' | 'deleted';
  /** What the entry was called, for the toast. Display only - never logged (ADR-0010). */
  description: string;
  /** When the undo window closes (epoch ms). */
  deadline: number;
  message?: string;
  /** The server said 404: someone (or another tab) already deleted it. */
  alreadyGone?: boolean;
}

interface UiState {
  pendingDeletes: Record<number, PendingDelete>;
  addSheetOpen: boolean;
  addSheetPrefill: AddSheetPrefill | null;
  selectedCycleId: string | null;
  /** Which commitment instance the settle sheet is open for - null means closed.
   *  One piece of global state because "Settle" appears on four different screens
   *  (Today, Month, Month Close, the instance's own detail page) and all four need to
   *  open the same sheet rather than each growing its own copy. */
  settlingInstanceId: number | null;
  /** The non-transaction add sheet the rail opened; for a bill, the month being viewed. */
  pageAdd: { kind: PageAddKind; cycleId: number | null } | null;
  /** What recent writes did, waiting to be read. Global rather than per-sheet because the
   *  sheet that caused it closes immediately - the report must outlive it (ADR-0017). */
  effectToasts: EffectToast[];
  nextToastId: number;
}

const initialState: UiState = {
  pendingDeletes: {},
  addSheetOpen: false,
  addSheetPrefill: null,
  selectedCycleId: null,
  settlingInstanceId: null,
  pageAdd: null,
  effectToasts: [],
  nextToastId: 1,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddSheet: (state, action: PayloadAction<AddSheetPrefill | undefined>) => {
      state.addSheetOpen = true;
      state.addSheetPrefill = action.payload ?? null;
    },
    closeAddSheet: (state) => {
      state.addSheetOpen = false;
      state.addSheetPrefill = null;
    },
    selectCycle: (state, action: PayloadAction<string>) => {
      state.selectedCycleId = action.payload;
    },
    openSettleSheet: (state, action: PayloadAction<number>) => {
      state.settlingInstanceId = action.payload;
    },
    closeSettleSheet: (state) => {
      state.settlingInstanceId = null;
    },
    showEffect: (state, action: PayloadAction<WriteEffect>) => {
      // Newest first, and never more than three on screen: a stack taller than that stops
      // being read and starts being cleared.
      state.effectToasts = [{ id: state.nextToastId, effect: action.payload }, ...state.effectToasts].slice(0, 3);
      state.nextToastId += 1;
    },
    dismissEffect: (state, action: PayloadAction<number>) => {
      state.effectToasts = state.effectToasts.filter((t) => t.id !== action.payload);
    },
    deleteQueued: (state, action: PayloadAction<{ id: number; description: string; deadline: number }>) => {
      const { id, description, deadline } = action.payload;
      state.pendingDeletes[id] = { phase: 'pending', description, deadline };
    },
    deleteCancelled: (state, action: PayloadAction<number>) => {
      delete state.pendingDeletes[action.payload];
    },
    deleteSending: (state, action: PayloadAction<number>) => {
      const p = state.pendingDeletes[action.payload];
      if (p) p.phase = 'sending';
    },
    deleteDone: (state, action: PayloadAction<{ id: number; alreadyGone: boolean }>) => {
      const p = state.pendingDeletes[action.payload.id];
      if (p) {
        p.phase = 'deleted';
        p.alreadyGone = action.payload.alreadyGone;
      }
    },
    deleteFailed: (state, action: PayloadAction<{ id: number; description: string; message: string }>) => {
      const { id, description, message } = action.payload;
      state.pendingDeletes[id] = { phase: 'failed', description, deadline: 0, message };
    },
    deleteCleared: (state, action: PayloadAction<number>) => {
      delete state.pendingDeletes[action.payload];
    },
    openPageAdd: (state, action: PayloadAction<{ kind: PageAddKind; cycleId?: number }>) => {
      state.pageAdd = { kind: action.payload.kind, cycleId: action.payload.cycleId ?? null };
    },
    closePageAdd: (state) => {
      state.pageAdd = null;
    },
  },
});

export const {
  openAddSheet,
  closeAddSheet,
  selectCycle,
  openSettleSheet,
  closeSettleSheet,
  openPageAdd,
  closePageAdd,
  showEffect,
  dismissEffect,
  deleteQueued,
  deleteCancelled,
  deleteSending,
  deleteDone,
  deleteFailed,
  deleteCleared,
} =
  uiSlice.actions;
export default uiSlice.reducer;
