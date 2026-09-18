package com.finance.loan.domain;

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

import java.time.Instant;

/** Links a real transaction to a schedule period - a fact, not derived. */
@Entity
@Table(name = "loan_payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "loan_id", nullable = false, updatable = false)
    private Long loanId;

    @Column(name = "period_number", nullable = false)
    private int periodNumber;

    @Column(name = "transaction_id", nullable = false, updatable = false)
    private Long transactionId;

    @Column(name = "paid_at", nullable = false, updatable = false)
    private Instant paidAt;
}
