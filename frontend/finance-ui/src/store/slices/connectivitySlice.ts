import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * Whether the server can be reached (UI_UX_REVAMP_PLAN §6.11). Fed by the base query, which
 * sees every request: two network failures in a row (an HTTP error response is NOT one - the
 * server answered) switch the app into connectivity mode; the first response of any kind ends it.
 *
 * <p>`lastOkAt` is the last time the server answered. The banner prints it so a figure on
 * screen is never mistaken for current while the server is unreachable.
 */
interface ConnectivityState {
  offline: boolean;
  failures: number;
  lastOkAt: number | null;
  offlineSince: number | null;
  /** Set for a few seconds after recovery so the banner can say "Back online". */
  recoveredAt: number | null;
}

const initialState: ConnectivityState = {
  offline: false,
  failures: 0,
  lastOkAt: null,
  offlineSince: null,
  recoveredAt: null,
};

const slice = createSlice({
  name: 'connectivity',
  initialState,
  reducers: {
    serverUnreachable: (state) => {
      state.failures += 1;
      if (!state.offline && state.failures >= 2) {
        state.offline = true;
        state.offlineSince = Date.now();
        state.recoveredAt = null;
      }
    },
    /** The browser itself says the network is gone - no need to wait for a second failure. */
    browserOffline: (state) => {
      if (!state.offline) {
        state.offline = true;
        state.failures = Math.max(state.failures, 2);
        state.offlineSince = Date.now();
        state.recoveredAt = null;
      }
    },
    serverAnswered: (state) => {
      state.lastOkAt = Date.now();
      state.failures = 0;
      if (state.offline) {
        state.offline = false;
        state.offlineSince = null;
        state.recoveredAt = Date.now();
      }
    },
    clearRecovered: (state, action: PayloadAction<void>) => {
      void action;
      state.recoveredAt = null;
    },
  },
});

export const { serverUnreachable, browserOffline, serverAnswered, clearRecovered } = slice.actions;
export default slice.reducer;
