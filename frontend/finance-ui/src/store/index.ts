import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api/baseApi';
import uiReducer from './slices/uiSlice';
import connectivityReducer from './slices/connectivitySlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    connectivity: connectivityReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
