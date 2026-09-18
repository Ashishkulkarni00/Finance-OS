package com.finance.investment.domain;

import com.finance.account.domain.BalanceConfidence;
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
 * A holding - a SIP, an RD, a provident fund.
 *
 * <p>The source workbook states the rule this class is shaped around: <em>"Current Value
 * is the only figure you keep updating by hand, and only as often as you like. Leave it
 * blank and the sheet says so rather than guessing."</em> So {@link #currentValue} is
 * nullable and always dated. Null means never valued, which is not zero, and everything
 * derived from it is withheld rather than computed (ADR-0006).
 *
 * <p><strong>What is deliberately not stored here:</strong> how much has gone in. When
 * this holding has a ledger account, that account's own balance already answers it, from
 * real postings - storing it again is how the two drift apart (ADR-0011).
 * {@link #statedInvested} exists only for holdings with no account at all.
 */
@Entity
@Table(name = "investments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Investment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private InvestmentType type;

    /** The INVESTMENT account this is held in. Null for holdings tracked outside the
     *  ledger entirely - a provident fund the employer deducts at source. */
    @Column(name = "account_id")
    private Long accountId;

    /** Where the contribution comes from. Null when nothing of ours pays it. */
    @Column(name = "pay_from_account_id")
    private Long payFromAccountId;

    @Column(name = "monthly_contribution", precision = 15, scale = 2)
    private BigDecimal monthlyContribution;

    @Column(name = "contribution_day")
    private Integer contributionDay;

    /** Only meaningful when {@link #accountId} is null - see the class comment. */
    @Column(name = "stated_invested", precision = 15, scale = 2)
    private BigDecimal statedInvested;

    /** The one figure kept by hand. Null = never valued. */
    @Column(name = "current_value", precision = 15, scale = 2)
    private BigDecimal currentValue;

    /** When {@link #currentValue} was last set. A valuation nobody can date looks current
     *  when it isn't, which is worse than having none. */
    @Column(name = "current_value_as_of")
    private LocalDate currentValueAsOf;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence", nullable = false, length = 20)
    @Builder.Default
    private BalanceConfidence confidence = BalanceConfidence.ESTIMATED;

    /**
     * Whether this could actually be turned into money if it were needed. The workbook's
     * note on its provident fund row: <em>"Not liquid - deliberately excluded from Safe
     * to Spend."</em> A holding being real and a holding being reachable are two facts,
     * and treating them as one is how a net worth figure becomes a lie about what you
     * can do.
     */
    @Column(name = "liquid", nullable = false)
    @Builder.Default
    private boolean liquid = true;

    @Column(name = "note", length = 500)
    private String note;

    /** Whether anything derived from a market value can be stated at all. */
    public boolean isValued() {
        return currentValue != null;
    }

    /** A holding with no ledger account is invisible to net worth, which is computed
     *  from accounts. Worth saying out loud rather than quietly under-reporting. */
    public boolean isOutsideLedger() {
        return accountId == null;
    }
}
