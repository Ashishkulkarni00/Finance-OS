package com.finance.insurance.domain;

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
import java.time.Instant;
import java.time.LocalDate;

/**
 * Being <strong>covered</strong> - the protection primitive (ROADMAP 0.3).
 *
 * <p>Everything else in the product answers "what do I have" or "what do I owe". A policy
 * answers a third question: <em>what would I not have to find if this happened?</em> That
 * is why it isn't just another commitment. The premium is a commitment - it behaves like
 * any bill and is generated as one, following this record the way an EMI follows a loan.
 * The cover is the part a commitment cannot express.
 *
 * <p><strong>{@code coverAmount} is never an asset.</strong> It is not added to net worth,
 * not counted as money held, and not spendable. Five lakhs of health cover is money you
 * would not have to find, not money you have; treating it as an asset would overstate net
 * worth by the one figure most likely to make someone feel safe.
 *
 * <p>Almost every field is nullable on purpose. "I'm covered but I don't remember for how
 * much" and "my employer pays for it" are both true and common states, and refusing to
 * record a policy until every box is filled loses the fact that cover exists at all
 * (ADR-0006).
 */
@Entity
@Table(name = "insurance_policies")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsurancePolicy extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private InsuranceType type;

    /** What the user calls it - "Mom's health cover". */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "insurer", length = 100)
    private String insurer;

    /** Last four of the policy number only - never the whole thing (ADR-0010). */
    @Column(name = "policy_last_four", length = 4)
    private String policyLastFour;

    /** What you'd be covered for. Never an asset - see the class comment. */
    @Column(name = "cover_amount", precision = 15, scale = 2)
    private BigDecimal coverAmount;

    /** Null when the user pays nothing - an employer policy still has cover worth recording. */
    @Column(name = "premium", precision = 15, scale = 2)
    private BigDecimal premium;

    @Enumerated(EnumType.STRING)
    @Column(name = "premium_frequency", length = 20)
    private PremiumFrequency premiumFrequency;

    /** When cover lapses if nothing is done - the date that actually matters. */
    @Column(name = "renews_on")
    private LocalDate renewsOn;

    @Column(name = "started_on")
    private LocalDate startedOn;

    /** Who it covers, in the user's words: "Mom", "me and Priya". */
    @Column(name = "covers", length = 255)
    private String covers;

    @Column(name = "note", length = 255)
    private String note;

    /**
     * The loan this policy's premium was financed by, when it was put on a card in
     * instalments. The debt is real and stays a loan; this only records that the two are
     * one arrangement, so the loan can say what it bought and the policy can say it's
     * still being paid for.
     */
    @Column(name = "loan_id")
    private Long loanId;

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

    /**
     * What this costs per month, for comparing against income - an annual premium spread
     * across the year it covers.
     *
     * <p>Null means unknown, never zero: a policy whose premium was never recorded costs
     * <em>something</em>, and reporting ₹0 would quietly improve the user's monthly picture
     * (ADR-0006). A genuine one-off is the exception and is really zero per month.
     */
    public BigDecimal monthlyCost() {
        if (premium == null || premiumFrequency == null) {
            return null;
        }
        if (premiumFrequency == PremiumFrequency.ONE_OFF) {
            return BigDecimal.ZERO.setScale(2);
        }
        BigDecimal perYear = premium.multiply(BigDecimal.valueOf(premiumFrequency.timesPerYear()));
        return perYear.divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP);
    }
}
