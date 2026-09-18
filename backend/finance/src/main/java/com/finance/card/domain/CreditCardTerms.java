package com.finance.card.domain;

import com.finance.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** One-to-one with a {@code CREDIT_CARD} account - limit and the statement cycle. */
@Entity
@Table(name = "credit_card_terms")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardTerms extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "account_id", nullable = false, updatable = false, unique = true)
    private Long accountId;

    @Column(name = "credit_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal creditLimit;

    /** Day of month the statement generates, 1-28. */
    @Column(name = "statement_day", nullable = false)
    private int statementDay;

    /** Day of month payment is due, 1-28. */
    @Column(name = "due_day", nullable = false)
    private int dueDay;

    /** Visa, RuPay... Descriptive only (V15). */
    @Enumerated(EnumType.STRING)
    @Column(name = "network", length = 20)
    private CardNetwork network;

    /** Suggested source account for the bill payment transfer - not enforced. A credit
     *  card is not attached to a bank account; this only pre-fills "Pay bill". */
    @Column(name = "pay_from_account_id")
    private Long payFromAccountId;
}
