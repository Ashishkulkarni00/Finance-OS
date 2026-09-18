import { baseApi } from './api/baseApi';
import type { ReservationResponse, CreateReservationRequest } from '@/types/reservation';
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
      invalidatesTags: [{ type: 'Reservation', id: 'LIST' }, 'Position'],
    }),
  }),
});

export const { useGetReservationsQuery, useCreateReservationMutation } = reservationService;
