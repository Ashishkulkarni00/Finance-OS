package com.finance.commitment.domain;

import com.finance.common.audit.AuditableEntity;
import com.finance.transaction.domain.TransactionType;
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
import java.time.Instant;
import java.time.LocalDate;

/**
 * The <strong>rule</strong> - "ZestMoney EMI, ₹4,200, due the 5th, mandatory". Distinct
 * from {@link CommitmentInstance}, the cycle-scoped <strong>occurrence</strong> this
 * rule generates. This split is, per DOMAIN_MODEL.md §2, the single most important
 * structural fix over the spreadsheet: a confirmation belongs to an instance, an
 * instance belongs to a cycle, so a stale tick cannot leak into the next cycle.
 */
@Entity
@Table(name = "commitments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commitment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "amount_type", nullable = false, length = 20)
    private CommitmentAmountType amountType;

    /** Required when {@code amountType} is FIXED, null when VARIABLE. */
    @Column(name = "fixed_amount", precision = 15, scale = 2)
    private BigDecimal fixedAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    private CommitmentFrequency frequency;

    /** Calendar day of month this falls due, 1-28 - same constraint as a cycle's start day. */
    @Column(name = "due_day", nullable = false)
    private int dueDay;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    /** Where the money goes when the bill is paid as a TRANSFER or an INVESTMENT - a savings
     *  account, an investment account. Null otherwise. */
    @Column(name = "to_account_id")
    private Long toAccountId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "mandatory", nullable = false)
    @Builder.Default
    private boolean mandatory = true;

    /** Plain-language reason this exists - "Family depends on it". Shown on every row it appears in. */
    @Column(name = "why", length = 255)
    private String why;

    /** The consequence of missing it - "Late fee and credit-score damage". Never alarming, just true. */
    @Column(name = "if_skipped", length = 255)
    private String ifSkipped;

    /** Where the amount, day, account and end come from - see CommitmentSource. */
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    @Builder.Default
    private CommitmentSource sourceType = CommitmentSource.MANUAL;

    /** The loan / investment / goal this bill follows. Null for a MANUAL bill. */
    @Column(name = "source_id")
    private Long sourceId;

    /**
     * What kind of Ledger entry pays this: an EXPENSE for most bills, a TRANSFER for money
     * moved to your own savings, an INVESTMENT for a SIP or RD instalment, INCOME for an
     * expected inflow such as the salary.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "settle_as", nullable = false, length = 20)
    @Builder.Default
    private TransactionType settleAs = TransactionType.EXPENSE;

    /** A requiresVerification commitment can never auto-reach PAID. */
    @Column(name = "requires_verification", nullable = false)
    @Builder.Default
    private boolean requiresVerification = false;

    @Column(name = "active_from", nullable = false)
    private LocalDate activeFrom;

    @Column(name = "active_to")
    private LocalDate activeTo;

    @Column(name = "archived_at")
    private Instant archivedAt;

    public boolean isArchived() {
        return archivedAt != null;
    }

    public void archive() {
        this.archivedAt = Instant.now();
    }

    public void unarchive() {
        this.archivedAt = null;
    }

    public boolean isActiveDuring(LocalDate cycleStart, LocalDate cycleEnd) {
        boolean startedInTime = !activeFrom.isAfter(cycleEnd);
        boolean notYetEnded = activeTo == null || !activeTo.isBefore(cycleStart);
        return startedInTime && notYetEnded;
    }
}
