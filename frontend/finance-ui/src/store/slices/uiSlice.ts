import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

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

interface UiState {
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
}

const initialState: UiState = {
  addSheetOpen: false,
  addSheetPrefill: null,
  selectedCycleId: null,
  settlingInstanceId: null,
  pageAdd: null,
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
    openPageAdd: (state, action: PayloadAction<{ kind: PageAddKind; cycleId?: number }>) => {
      state.pageAdd = { kind: action.payload.kind, cycleId: action.payload.cycleId ?? null };
    },
    closePageAdd: (state) => {
      state.pageAdd = null;
    },
  },
});

export const { openAddSheet, closeAddSheet, selectCycle, openSettleSheet, closeSettleSheet, openPageAdd, closePageAdd } =
  uiSlice.actions;
export default uiSlice.reducer;
