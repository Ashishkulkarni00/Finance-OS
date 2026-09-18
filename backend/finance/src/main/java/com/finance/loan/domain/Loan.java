package com.finance.loan.domain;

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
import java.time.LocalDate;

/**
 * A loan's terms - one-to-one with a {@code LOAN} account. {@code emi} is the bank's
 * actual figure, typed in like a card statement's total - not recomputed from
 * principal/rate/tenure, which can disagree with it by a rounding convention the bank
 * doesn't publish. The amortisation schedule itself is generated from these fields on
 * every read ({@code AmortisationCalculator}), never stored - ADR-0011.
 */
@Entity
@Table(name = "loans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Loan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "account_id", nullable = false, updatable = false, unique = true)
    private Long accountId;

    @Column(name = "lender", nullable = false, length = 100)
    private String lender;

    /** The original amount borrowed. Background only since V13 - optional, and nothing is
     *  derived from it. Where the loan stands is {@link #outstandingBalance}. */
    @Column(name = "principal", precision = 15, scale = 2)
    private BigDecimal principal;

    /** Annual percentage rate, e.g. 10.50 for 10.5%. Null when never supplied - the
     *  workbook's "TBD". Unknown is not zero (ADR-0006). */
    @Column(name = "annual_rate", precision = 6, scale = 3)
    private BigDecimal annualRate;

    /** Original tenure. Background only since V13. */
    @Column(name = "tenure_months")
    private Integer tenureMonths;

    /** When the loan was disbursed. Background only since V13. */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** The first EMI of the original loan - usually a month after disbursal, not always
     *  (V14). What EMIs are counted from when estimating where a loan stands. */
    @Column(name = "original_first_emi_date")
    private LocalDate originalFirstEmiDate;

    @Column(name = "emi", nullable = false, precision = 15, scale = 2)
    private BigDecimal emi;

    /**
     * What was owed on {@link #balanceAsOf} - the loan's stated position, from which every
     * figure is derived forward (V13). Stated rather than derived from the original terms
     * because nothing records loan payments: a loan started years ago can only be
     * described by where it stands.
     */
    @Column(name = "outstanding_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal outstandingBalance;

    /** The date {@link #outstandingBalance} and {@link #emisRemaining} are true for. Never in the future. */
    @Column(name = "balance_as_of", nullable = false)
    private LocalDate balanceAsOf;

    /** EMIs still to pay as of {@link #balanceAsOf}. */
    @Column(name = "emis_remaining", nullable = false)
    private int emisRemaining;

    /** The first EMI after {@link #balanceAsOf}; later EMIs fall monthly from it on the
     *  EMI day. Null means "the next EMI day after balanceAsOf" - see AmortisationCalculator. */
    @Column(name = "first_emi_date")
    private LocalDate firstEmiDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "paid_via", nullable = false, length = 20)
    private LoanPaidVia paidVia;

    /** Gates the derived figures - see {@link LoanConfidence}. */
    @Enumerated(EnumType.STRING)
    @Column(name = "confidence", nullable = false, length = 20)
    @Builder.Default
    private LoanConfidence confidence = LoanConfidence.ESTIMATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LoanStatus status = LoanStatus.ACTIVE;

    /** Day of the month the EMI falls. Null until supplied. */
    @Column(name = "emi_day")
    private Integer emiDay;

    /**
     * The account the EMI actually leaves from - <strong>not</strong> {@code accountId},
     * which is the loan liability itself. Null when never recorded; nothing infers it,
     * because a name-match between "Bike loan EMI" and "Bike Loan" is a guess dressed as
     * a fact.
     */
    @Column(name = "pay_from_account_id")
    private Long payFromAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rate_type", nullable = false, length = 20)
    @Builder.Default
    private RateType rateType = RateType.FIXED;

    @Column(name = "note", length = 500)
    private String note;

    /** Whether this loan's EMI leaves a bank account directly, as opposed to arriving
     *  inside a credit-card bill. The distinction the workbook's summary block draws,
     *  and the one that stops a card EMI being counted as cash leaving twice (rule 4). */
    public boolean debitsBankDirectly() {
        return paidVia == LoanPaidVia.BANK;
    }
}
