package com.finance.forecast;

import com.finance.common.money.MoneyScale;
import com.finance.forecast.dto.ForecastResponse;
import org.springframework.stereotype.Component;

@Component
public class ForecastMapper {

    public ForecastResponse toResponse(ForecastResult result) {
        return new ForecastResponse(result.months().stream().map(this::toMonth).toList(),
                MoneyScale.normalise(result.unlockedMonthlyTotal()));
    }

    private ForecastResponse.Month toMonth(ForecastMonth m) {
        return new ForecastResponse.Month(
                m.cycleStart(), m.cycleEnd(),
                MoneyScale.normalise(m.incomeExpected()), MoneyScale.normalise(m.committed()), MoneyScale.normalise(m.setAside()),
                m.flexible() == null ? null : MoneyScale.normalise(m.flexible()),
                m.unknownAmountCount(),
                m.unlocks().stream()
                        .map(u -> new ForecastResponse.Unlock(u.commitmentId(), u.name(), MoneyScale.normalise(u.amount()), u.bucket()))
                        .toList(),
                m.annualItems().stream()
                        .map(a -> new ForecastResponse.AnnualItem(a.commitmentId(), a.name(),
                                a.amount() == null ? null : MoneyScale.normalise(a.amount()), a.dueDate()))
                        .toList());
    }
}
