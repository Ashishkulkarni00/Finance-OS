package com.finance.reservation;

import com.finance.reservation.domain.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/** Data access for reservations. Every query filters by {@code userId}. */
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    Page<Reservation> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    List<Reservation> findByUserIdAndDeletedAtIsNull(Long userId);

    List<Reservation> findByAccountIdAndDeletedAtIsNull(Long accountId);

    /** Total reserved against one account - the seam Real Balance reads for "reserved". */
    @Query("""
            select coalesce(sum(r.amount), 0.00) from Reservation r
            where r.accountId = :accountId and r.userId = :userId and r.deletedAt is null
            """)
    BigDecimal sumReservedForAccount(@Param("accountId") Long accountId, @Param("userId") Long userId);

    /**
     * Money set aside against one goal, wherever it happens to sit.
     *
     * <p>This is how a goal counts money that has not moved: earmarked in the salary
     * account, still physically there, but no longer spendable. {@code goal_id} has been on
     * this table since V3 and nothing read it until now (ROADMAP: goals count what's set
     * aside for them).
     */
    List<Reservation> findByGoalIdAndUserIdAndDeletedAtIsNull(Long goalId, Long userId);

    /** Total reserved across every account - Real Balance's system-wide "reserved" term. */
    @Query("""
            select coalesce(sum(r.amount), 0.00) from Reservation r
            where r.userId = :userId and r.deletedAt is null
            """)
    BigDecimal sumReservedForUser(@Param("userId") Long userId);
}
