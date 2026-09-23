package com.finance.insight.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.insight.Insight;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightType;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code GET /insights?surface=TODAY|MONTH}: the few that matter, ranked, and how many
 * there are in all ("and 2 more"). Wording is the server's so every screen says it the same way.
 */
public record InsightListResponse(List<Item> items, int total) {

    public record Item(
            String key,
            InsightType type,
            Insight.Severity severity,
            String title,
            String explanation,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal impact,
            LocalDate when,
            Action action
    ) {
    }

    /** One action; which fields are set depends on {@code kind}. */
    public record Action(
            InsightAction.Kind kind,
            String label,
            Long instanceId,
            Long fromAccountId,
            Long toAccountId,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
            String route
    ) {
    }

    public static InsightListResponse of(List<Insight> shown, int total) {
        return new InsightListResponse(shown.stream().map(InsightListResponse::item).toList(), total);
    }

    /** One insight on the wire. Shared so a warning reads identically wherever it appears -
     *  the list, and the effect a write reports (ADR-0017). */
    public static Item item(Insight i) {
        return new Item(i.key(), i.type(), i.severity(), i.title(), i.explanation(), i.impact(), i.when(),
                i.action() == null ? null : new Action(i.action().kind(), i.action().label(),
                        i.action().instanceId(), i.action().fromAccountId(), i.action().toAccountId(),
                        i.action().amount(), i.action().route()));
    }
}
