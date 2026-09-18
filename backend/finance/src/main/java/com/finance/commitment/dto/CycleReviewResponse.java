package com.finance.commitment.dto;

import com.finance.commitment.CycleReview;
import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** {@code GET /cycles/{id}/review} - see {@link CycleReview}. Money as strings. */
public record CycleReviewResponse(
        @JsonSerialize(using = MoneySerializer.class) BigDecimal incomeExpected,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal incomeReceived,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal paymentsPlanned,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal paymentsPaid,
        int paymentsCount,
        int paymentsPaidCount,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal setAsidePlanned,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal setAsideMade,
        /** Absent when nothing was coming in. */
        @JsonSerialize(using = MoneySerializer.class) BigDecimal flexible,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal spentOutsidePlan,
        List<Item> notDone,
        List<Item> skipped,
        List<Difference> differences,
        List<Spend> largestUnplanned
) {
    public record Item(Long instanceId, String name, @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
                       LocalDate dueDate, boolean mandatory, boolean savings) {
    }

    public record Difference(Long instanceId, String name,
                             @JsonSerialize(using = MoneySerializer.class) BigDecimal planned,
                             @JsonSerialize(using = MoneySerializer.class) BigDecimal actual,
                             /** actual − planned: positive = paid more than planned. */
                             @JsonSerialize(using = MoneySerializer.class) BigDecimal difference) {
    }

    public record Spend(Long transactionId, String description, LocalDate date,
                        @JsonSerialize(using = MoneySerializer.class) BigDecimal amount, String category) {
    }

    public static CycleReviewResponse of(CycleReview r) {
        return new CycleReviewResponse(r.incomeExpected(), r.incomeReceived(), r.paymentsPlanned(), r.paymentsPaid(),
                r.paymentsCount(), r.paymentsPaidCount(), r.setAsidePlanned(), r.setAsideMade(), r.flexible(),
                r.spentOutsidePlan(),
                r.notDone().stream().map(CycleReviewResponse::item).toList(),
                r.skipped().stream().map(CycleReviewResponse::item).toList(),
                r.differences().stream().map(d -> new Difference(d.instanceId(), d.name(), d.planned(), d.actual(),
                        d.difference())).toList(),
                r.largestUnplanned().stream().map(s -> new Spend(s.transactionId(), s.description(), s.date(),
                        s.amount(), s.category())).toList());
    }

    private static Item item(CycleReview.Item i) {
        return new Item(i.instanceId(), i.name(), i.amount(), i.dueDate(), i.mandatory(), i.savings());
    }
}
