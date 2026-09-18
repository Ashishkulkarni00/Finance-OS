package com.finance.insight;

import java.math.BigDecimal;

/**
 * The one thing the user can do about an insight. The client maps each kind to an existing
 * screen or sheet - the engine never performs anything itself.
 *
 * @param label        button text ("Settle", "Move money")
 * @param instanceId   for SETTLE / ESTIMATE / CONFIRM
 * @param fromAccountId, toAccountId, amount  a pre-filled transfer, for TRANSFER
 * @param route        for OPEN - an in-app path
 */
public record InsightAction(Kind kind, String label, Long instanceId, Long fromAccountId, Long toAccountId,
                            BigDecimal amount, String route) {

    public enum Kind { SETTLE, ESTIMATE, CONFIRM, TRANSFER, OPEN }

    public static InsightAction instance(Kind kind, String label, Long instanceId) {
        return new InsightAction(kind, label, instanceId, null, null, null, null);
    }

    public static InsightAction transfer(String label, Long from, Long to, BigDecimal amount) {
        return new InsightAction(Kind.TRANSFER, label, null, from, to, amount, null);
    }

    public static InsightAction open(String label, String route) {
        return new InsightAction(Kind.OPEN, label, null, null, null, null, route);
    }
}
