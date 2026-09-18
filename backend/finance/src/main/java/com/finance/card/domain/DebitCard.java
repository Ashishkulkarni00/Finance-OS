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

/**
 * A debit card - a way of spending from one bank account (V15). It has no balance and
 * nothing is derived from it: a spend on it is an expense from its bank account. Recorded
 * so the user can see which cards reach which account.
 */
@Entity
@Table(name = "debit_cards")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitCard extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    /** Always a BANK account - see DebitCardServiceImpl. */
    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "network", length = 20)
    private CardNetwork network;

    /** Last four digits only. */
    @Column(name = "last_four", length = 4)
    private String lastFour;
}
