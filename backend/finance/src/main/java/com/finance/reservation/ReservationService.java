package com.finance.reservation;

import com.finance.reservation.dto.CreateReservationRequest;
import com.finance.reservation.dto.UpdateReservationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReservationService {

    ReservationView create(CreateReservationRequest request);

    ReservationView getById(Long id);

    Page<ReservationView> list(Pageable pageable);

    ReservationView update(Long id, UpdateReservationRequest request);

    /** Releases the reservation - a soft delete; the money is no longer set aside. */
    void release(Long id);

    /** Total reserved across every account for the current user - Real Balance's "reserved" term. */
    java.math.BigDecimal totalReservedForUser();
}
