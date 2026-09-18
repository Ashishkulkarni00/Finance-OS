package com.finance.reservation.domain;

import com.finance.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Money that is physically present but deliberately set aside - an emergency fund, a
 * trip, a deposit being saved for. First-class, not a category tag: this is what lets
 * Real Balance be {@code held − reserved − committed} instead of a single number that
 * hides the difference between "mine" and "spendable". See DOMAIN_MODEL.md §1.
 *
 * <p>{@code goalId} is a plain unconstrained column for now - {@code Goal} does not
 * exist until milestone 10. The FK constraint is added then; the column exists now so
 * that migration does not need to alter this table later.
 */
@Entity
@Table(name = "reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "purpose", nullable = false, length = 255)
    private String purpose;

    /** Not yet a real foreign key - see the class comment. Null until milestone 10. */
    @Column(name = "goal_id")
    private Long goalId;
}
