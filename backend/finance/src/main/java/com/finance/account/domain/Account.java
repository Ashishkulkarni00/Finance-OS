package com.finance.account.domain;

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
 * A container of money belonging to one user.
 *
 * <p><strong>Opening balance is anchored per account, not globally.</strong> The
 * spreadsheet this product replaces used one "balance as at" date for every account,
 * which produced a real, unresolvable ambiguity when one bank could be read and
 * another could not. Each account therefore carries its own {@code openingAsOf} and
 * its own confidence. See ADR-0009.
 *
 * <p>The current balance is <em>never</em> stored. It is opening balance plus the
 * movements recorded after {@code openingAsOf}. Storing it is how ledgers drift.
 */
@Entity
@Table(name = "accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ownership boundary. Present from day one so multi-user is a policy change. */
    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private AccountType type;

    /** Bank or provider name. Never an account number - see ADR-0010. */
    @Column(name = "institution", length = 100)
    private String institution;

    /** Last four digits only, for recognition. Never the full number. */
    @Column(name = "last_four", length = 4)
    private String lastFour;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "opening_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal openingBalance;

    @Column(name = "opening_as_of", nullable = false)
    private LocalDate openingAsOf;

    @Enumerated(EnumType.STRING)
    @Column(name = "opening_confidence", nullable = false, length = 20)
    @Builder.Default
    private BalanceConfidence openingConfidence = BalanceConfidence.CONFIRMED;

    /** Minimum the institution requires. Breaching it can attract a penalty. */
    @Column(name = "minimum_balance", precision = 15, scale = 2)
    private BigDecimal minimumBalance;

    @Column(name = "minimum_balance_mandatory", nullable = false)
    @Builder.Default
    private boolean minimumBalanceMandatory = false;

    /** Overrides the type default, for the rare account that behaves differently. */
    @Column(name = "include_in_spendable", nullable = false)
    @Builder.Default
    private boolean includeInSpendable = true;

    @Column(name = "include_in_net_worth", nullable = false)
    @Builder.Default
    private boolean includeInNetWorth = true;

    /** Why this account exists, in the user's own words. */
    @Column(name = "purpose", length = 255)
    private String purpose;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    /**
     * Archived accounts keep their history but drop out of active views.
     * Distinct from {@code deletedAt}: archiving is a user action, deletion is a mistake.
     */
    @Column(name = "archived_at")
    private java.time.Instant archivedAt;

    public boolean isArchived() {
        return archivedAt != null;
    }

    public void archive() {
        this.archivedAt = java.time.Instant.now();
    }

    public void unarchive() {
        this.archivedAt = null;
    }

    /** Whether this account's balance may be counted toward money available to spend. */
    public boolean countsAsSpendable() {
        return includeInSpendable && type.isSpendable() && !isArchived() && !isDeleted();
    }
}
