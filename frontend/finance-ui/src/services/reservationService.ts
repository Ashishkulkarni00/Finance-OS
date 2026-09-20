import { baseApi } from './api/baseApi';
import type { ReservationResponse, CreateReservationRequest, UpdateReservationRequest } from '@/types/reservation';
import type { PageResponse } from '@/types/api';

export const reservationService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReservations: build.query<PageResponse<ReservationResponse>, void>({
      query: () => ({ url: '/reservations', params: { size: 50 } }),
      providesTags: (result) =>
        result
          ? [...result.content.map((r) => ({ type: 'Reservation' as const, id: r.id })), { type: 'Reservation' as const, id: 'LIST' }]
          : [{ type: 'Reservation' as const, id: 'LIST' }],
    }),

    createReservation: build.mutation<ReservationResponse, CreateReservationRequest>({
      query: (body) => ({ url: '/reservations', method: 'POST', body }),
      invalidatesTags: [{ type: 'Reservation', id: 'LIST' }, 'Position', 'Account', 'Goal'],
    }),

    updateReservation: build.mutation<ReservationResponse, { id: number; body: UpdateReservationRequest }>({
      query: ({ id, body }) => ({ url: `/reservations/${id}`, method: 'PATCH', body }),
      // 'Goal' too: a goal tracked against a reservation reads its amount as progress.
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Reservation', id }, { type: 'Reservation', id: 'LIST' }, 'Position', 'Account', 'Goal'],
    }),

    /** Releasing it: the money goes back to being spendable. */
    deleteReservation: build.mutation<void, number>({
      query: (id) => ({ url: `/reservations/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Reservation', id }, { type: 'Reservation', id: 'LIST' }, 'Position', 'Account', 'Goal'],
    }),
  }),
});

export const {
  useGetReservationsQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
} = reservationService;
