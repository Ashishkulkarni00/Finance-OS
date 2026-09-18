package com.finance.loan;

import com.finance.common.money.MoneyScale;
import com.finance.loan.dto.LoanEstimateRequest;
import com.finance.loan.dto.LoanEstimateResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

/**
 * Works out the parts of a loan the user shouldn't have to calculate by hand, from the
 * parts they know. Backs the loan forms' pre-filled fields; stores nothing and reads no
 * user data, so there is nothing to scope by user.
 *
 * <p>Conventions, as Indian lenders apply them:
 * <ul>
 *   <li>The first EMI falls a month after disbursal, on the EMI day - unless the user says
 *       otherwise. There's no EMI in the month the money is released.</li>
 *   <li>An EMI whose due date is on or before the as-of date has been paid, and is already
 *       inside the outstanding principal for that date - the same rule the saved loan uses.</li>
 *   <li>EMIs are quoted to the whole rupee.</li>
 * </ul>
 */
@Component
public class LoanEstimator {

    private static final BigDecimal MIN_TOLERANCE = new BigDecimal("5");
    private static final BigDecimal ONE_PERCENT = new BigDecimal("0.01");

    private final AmortisationCalculator calculator;
    private final Clock clock;

    public LoanEstimator(AmortisationCalculator calculator, Clock clock) {
        this.calculator = calculator;
        this.clock = clock;
    }

    public LoanEstimateResponse estimate(LoanEstimateRequest req) {
        LocalDate asOf = req.asOf() != null ? req.asOf() : LocalDate.now(clock);
        BigDecimal rate = req.annualRate();
        Integer tenure = req.tenureMonths();

        LocalDate first = req.originalFirstEmiDate();
        if (first == null && req.startDate() != null) {
            int day = req.emiDay() != null ? req.emiDay() : req.startDate().getDayOfMonth();
            first = AmortisationCalculator.monthly(req.startDate().plusMonths(1), day, 1);
        }
        Integer emiDay = req.emiDay() != null ? req.emiDay() : first != null ? first.getDayOfMonth() : null;

        BigDecimal standardEmi = req.principal() != null && rate != null && tenure != null
                ? calculator.standardEmi(req.principal(), rate, tenure) : null;
        BigDecimal emi = req.emi() != null ? MoneyScale.normalise(req.emi()) : standardEmi;

        Integer paid = null;
        Integer remaining = null;
        LocalDate next = null;
        LocalDate last = null;
        BigDecimal outstanding = null;

        if (first != null && tenure != null) {
            // From the original terms: count the EMIs the calendar says have gone out.
            int count = 0;
            while (count < tenure && !AmortisationCalculator.monthly(first, emiDay, count + 1).isAfter(asOf)) {
                count++;
            }
            paid = count;
            remaining = tenure - count;
            next = remaining > 0 ? AmortisationCalculator.monthly(first, emiDay, count + 1) : null;
            last = AmortisationCalculator.monthly(first, emiDay, tenure);
            if (req.principal() != null) {
                if (remaining == 0) {
                    outstanding = MoneyScale.ZERO;
                } else if (count == 0) {
                    outstanding = MoneyScale.normalise(req.principal());
                } else if (rate != null && emi != null) {
                    outstanding = calculator.balanceAfter(req.principal(), rate, emi, count);
                }
            }
        } else if (req.outstandingBalance() != null) {
            // From today's figures: any two of rate, EMI and EMIs left give the third.
            outstanding = MoneyScale.normalise(req.outstandingBalance());
            remaining = req.emisRemaining();
            if (remaining == null && rate != null && emi != null) {
                int implied = calculator.impliedEmis(outstanding, rate, emi);
                remaining = implied >= 0 ? implied : null;
            }
            if (emi == null && rate != null && remaining != null && remaining > 0) {
                emi = calculator.standardEmi(outstanding, rate, remaining);
            }
            if (emiDay != null) {
                LocalDate thisMonth = AmortisationCalculator.monthly(asOf, emiDay, 1);
                next = thisMonth.isAfter(asOf) ? thisMonth : AmortisationCalculator.monthly(asOf, emiDay, 2);
            }
            if (next != null && remaining != null && remaining > 0) {
                last = AmortisationCalculator.monthly(next, emiDay, remaining);
            }
        }

        Boolean differs = null;
        if (req.emi() != null && standardEmi != null) {
            BigDecimal tolerance = standardEmi.multiply(ONE_PERCENT).max(MIN_TOLERANCE);
            differs = req.emi().subtract(standardEmi).abs().compareTo(tolerance) > 0;
        }

        return new LoanEstimateResponse(asOf, standardEmi, emi, differs, first, last, paid, remaining, next, outstanding);
    }
}
