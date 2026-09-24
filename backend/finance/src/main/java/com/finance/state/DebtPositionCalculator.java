package com.finance.state;

import com.finance.common.money.MoneyScale;
import com.finance.loan.LoanService;
import com.finance.loan.LoanSummary;
import com.finance.loan.LoanView;
import com.finance.loan.domain.Loan;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Rolls every loan into one position. See {@link DebtPosition} for what each figure means
 * and the one that must never be treated as cash flow.
 */
@Component
public class DebtPositionCalculator {

    private final LoanService loanService;

    public DebtPositionCalculator(LoanService loanService) {
        this.loanService = loanService;
    }

    /** @param expectedIncome the cycle's expected income, or null if it isn't known. */
    public DebtPosition calculate(BigDecimal expectedIncome) {
        List<LoanView> loans = loanService.list(Pageable.unpaged()).getContent();
        LoanSummary summary = loanService.summary();

        Provenance.Builder basis = Provenance.of("every loan's outstanding, from the payments recorded against it");
        basis.section("Still owed, by loan");
        BigDecimal outstanding = BigDecimal.ZERO;
        BigDecimal rateWeighted = BigDecimal.ZERO;
        BigDecimal ratedBalance = BigDecimal.ZERO;
        boolean rateComplete = true;
        LocalDate debtFree = null;
        boolean payoffComplete = true;
        int withoutTerms = 0;

        for (LoanView view : loans) {
            Loan loan = view.loan();
            // A loan is known by its account's name on every screen ("HDFC bike"); the lender
            // is the fallback, because "loan #4" tells a person nothing.
            String name = view.account() != null ? view.account().getName() : loan.getLender();
            BigDecimal balance = view.outstandingPrincipal() == null ? BigDecimal.ZERO : view.outstandingPrincipal();
            outstanding = outstanding.add(balance);

            if (loan.getAnnualRate() == null || loan.getTenureMonths() == null) {
                withoutTerms++;
                basis.excluded(name + " - no rate or tenure recorded", Provenance.Ref.Kind.LOAN, loan.getId());
            } else {
                basis.line(name, balance, Provenance.Ref.Kind.LOAN, loan.getId());
            }

            if (view.unrecordedEmis() > 0) {
                basis.caveat(name + ": " + view.unrecordedEmis()
                        + (view.unrecordedEmis() == 1 ? " EMI isn't recorded yet" : " EMIs aren't recorded yet")
                        + ", so this balance is still describing an earlier month.");
            }

            // A rate only earns its weight through the money still sitting at it. A ₹5,000
            // card loan at 22% and a ₹2,00,000 bike loan at 9% do not average to 15.5%.
            if (balance.signum() > 0) {
                if (loan.getAnnualRate() == null) {
                    rateComplete = false;
                } else {
                    rateWeighted = rateWeighted.add(loan.getAnnualRate().multiply(balance));
                    ratedBalance = ratedBalance.add(balance);
                }
            }

            if (balance.signum() > 0) {
                if (view.payoffDate() == null) {
                    payoffComplete = false;
                } else if (debtFree == null || view.payoffDate().isAfter(debtFree)) {
                    debtFree = view.payoffDate();
                }
            }
        }

        BigDecimal emiTotal = MoneyScale.normalise(summary.bankEmiTotal().add(summary.cardEmiTotal()));
        BigDecimal share = null;
        if (expectedIncome != null && expectedIncome.signum() > 0) {
            share = emiTotal.divide(expectedIncome, 4, RoundingMode.HALF_UP);
        }
        BigDecimal avgRate = (rateComplete && ratedBalance.signum() > 0)
                ? rateWeighted.divide(ratedBalance, 4, RoundingMode.HALF_UP)
                : null;

        basis.total(MoneyScale.normalise(outstanding));
        basis.section("What leaves each month")
                .line("From a bank account", summary.bankEmiTotal(), null, null)
                .line("Billed to a card", summary.cardEmiTotal(), null, null)
                .total(emiTotal);

        if (!payoffComplete) {
            basis.caveat("At least one loan has no payoff date, so there is no debt-free date to give.");
        }
        if (!rateComplete) {
            basis.caveat("At least one loan with a balance has no rate, so no average rate can be given.");
        }
        basis.caveat("EMIs billed to a card arrive inside the card bill - this total is what you owe each "
                + "month, not what leaves your bank.");

        return new DebtPosition(
                MoneyScale.normalise(outstanding),
                summary.bankEmiTotal(), summary.cardEmiTotal(), emiTotal,
                share, avgRate,
                payoffComplete ? debtFree : null,
                loans.size(), withoutTerms, basis.build());
    }
}
