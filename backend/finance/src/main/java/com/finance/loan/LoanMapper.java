package com.finance.loan;

import com.finance.account.AccountMapper;
import com.finance.loan.dto.AmortisationEntryResponse;
import com.finance.loan.dto.LoanResponse;
import com.finance.loan.dto.LoanSummaryResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LoanMapper {

    private final AccountMapper accountMapper;

    public LoanMapper(AccountMapper accountMapper) {
        this.accountMapper = accountMapper;
    }

    public LoanResponse toResponse(LoanView view) {
        var loan = view.loan();
        // Repaid since the balance date. Withheld, not zeroed, when today's outstanding
        // isn't known - "₹0 repaid" would be a claim about the loan, not our records.
        var amountRepaid = view.outstandingPrincipal() == null
                ? null : loan.getOutstandingBalance().subtract(view.outstandingPrincipal());

        return new LoanResponse(
                loan.getId(),
                accountMapper.toSummary(view.account()),
                accountMapper.toSummary(view.payFromAccount()),
                loan.getLender(),
                loan.getOutstandingBalance(), loan.getBalanceAsOf(), loan.getEmisRemaining(), view.firstEmiDate(),
                loan.getPrincipal(), loan.getAnnualRate(), loan.getRateType(),
                loan.getTenureMonths(), loan.getStartDate(), loan.getOriginalFirstEmiDate(), loan.getEmiDay(),
                loan.getEmi(), loan.getPaidVia(), loan.getConfidence(), loan.getStatus(), loan.getNote(),
                view.outstandingPrincipal(), amountRepaid, view.payoffDate(),
                view.emisLeft(), view.remainingPayments(),
                view.impliedEmisRemaining(), view.termsConsistent(), view.planCommitmentId());
    }

    public LoanSummaryResponse toResponse(LoanSummary summary) {
        return new LoanSummaryResponse(summary.count(), summary.bankEmiTotal(), summary.cardEmiTotal(),
                summary.remainingPaymentsTotal(), summary.unconfirmedCount(), summary.tbdCount());
    }

    public List<AmortisationEntryResponse> toScheduleResponse(List<AmortisationEntry> schedule, int paidPeriods) {
        return schedule.stream()
                .map(e -> new AmortisationEntryResponse(
                        e.period(), e.dueDate(), e.principalComponent(), e.interestComponent(),
                        e.closingBalance(), e.period() <= paidPeriods))
                .toList();
    }
}
