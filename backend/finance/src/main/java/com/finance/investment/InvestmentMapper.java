package com.finance.investment;

import com.finance.account.AccountMapper;
import com.finance.investment.domain.Investment;
import com.finance.investment.dto.InvestmentResponse;
import com.finance.investment.dto.InvestmentSummaryResponse;
import org.springframework.stereotype.Component;

@Component
public class InvestmentMapper {

    private final AccountMapper accountMapper;

    public InvestmentMapper(AccountMapper accountMapper) {
        this.accountMapper = accountMapper;
    }

    public InvestmentResponse toResponse(InvestmentView view) {
        Investment i = view.investment();
        return new InvestmentResponse(
                i.getId(), i.getName(), i.getType(), i.getType().label(),
                accountMapper.toSummary(view.account()),
                accountMapper.toSummary(view.payFromAccount()),
                i.getMonthlyContribution(), i.getContributionDay(),
                view.openingInvested(), view.addedSince(), view.totalInvested(),
                i.getCurrentValue(), i.getCurrentValueAsOf(), view.valuationAgeDays(),
                view.gain(), view.gainPercent(),
                i.getConfidence(), i.isLiquid(), i.isOutsideLedger(), i.getNote(), view.planCommitmentId());
    }

    public InvestmentSummaryResponse toResponse(InvestmentSummary summary) {
        return new InvestmentSummaryResponse(
                summary.count(), summary.totalInvested(), summary.valuedTotalInvested(),
                summary.totalCurrentValue(), summary.totalGain(), summary.totalGainPercent(),
                summary.outsideLedgerTotal(),
                summary.illiquidTotal(), summary.valuedCount(), summary.valuationState(),
                summary.liquidTotal(), summary.monthlyContributionTotal(),
                summary.allocation().stream()
                        .map(a -> new InvestmentSummaryResponse.AllocationResponse(
                                a.investmentId(), a.name(), a.totalInvested(), a.share(), a.liquid()))
                        .toList());
    }
}
