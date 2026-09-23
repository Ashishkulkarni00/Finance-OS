package com.finance.insurance.domain;

/**
 * What a policy covers. An enum rather than free text so the register can group and label
 * consistently - the same reasoning as {@code AccountType} (ADR-0008) and
 * {@code InvestmentType}.
 *
 * <p>Typed from the start so a warranty or an appliance AMC fits here later without a
 * migration: they are the same shape - a premium paid against a cost you would otherwise
 * have to find yourself. Nothing is built for them yet.
 */
public enum InsuranceType {

    HEALTH("Health"),
    LIFE("Life"),
    MOTOR("Motor"),
    HOME("Home"),
    OTHER("Other");

    private final String label;

    InsuranceType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
