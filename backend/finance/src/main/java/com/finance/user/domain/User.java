package com.finance.user.domain;

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

/**
 * The owner of a financial world.
 *
 * <p>Minimal by design: authentication is deferred, so this holds identity and the
 * settings that shape every calculation. It exists now purely so that ownership is a
 * real foreign key from the first migration rather than a column added later.
 *
 * <p>{@code cycleStartDay} is the most consequential field in the application. It is
 * what makes the financial month run salary-to-salary instead of calendar-month, and
 * every cycle, budget, comparison and history row derives from it.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    /** Day of month the salary lands. 28 means the cycle runs the 28th to the 27th. */
    @Column(name = "cycle_start_day", nullable = false)
    @Builder.Default
    private Integer cycleStartDay = 1;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "timezone", nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Asia/Kolkata";
}
