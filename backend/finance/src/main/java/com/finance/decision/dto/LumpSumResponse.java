package com.finance.decision.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.decision.LumpSumOption;
import com.finance.decision.LumpSumResult;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/** {@code GET /decisions/lump-sum} - see {@link LumpSumResult}. Money as strings; null means unknown. */
public record LumpSumResponse(
        @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
        BigDecimal runwayMonthsBefore,
        BigDecimal breakEvenRate,
        String breakEvenLoan,
        List<Option> options
) {
    public record Option(
            String kind,
            Long targetId,
            String targetName,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal applied,
            Integer clearsMonthsSooner,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal interestSaved,
            boolean closesLoan,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal emiFreed,
            BigDecimal annualRate,
            String goalBefore,
            String goalAfter,
            String goalAfterReason,
            BigDecimal runwayMonthsAfter,
            String unknownReason
    ) {
        static Option from(LumpSumOption o) {
            return new Option(o.kind().name(), o.targetId(), o.targetName(), o.applied(), o.clearsMonthsSooner(),
                    o.interestSaved(), o.closesLoan(), o.emiFreed(), o.annualRate(),
                    o.goalBefore() == null ? null : o.goalBefore().name(),
                    o.goalAfter() == null ? null : o.goalAfter().name(), o.goalAfterReason(),
                    o.runwayMonthsAfter(), o.unknownReason());
        }
    }

    public static LumpSumResponse from(LumpSumResult r) {
        return new LumpSumResponse(r.amount(), r.runwayMonthsBefore(), r.breakEvenRate(), r.breakEvenLoan(),
                r.options().stream().map(Option::from).toList());
    }
}
