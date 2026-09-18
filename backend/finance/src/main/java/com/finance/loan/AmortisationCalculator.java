package com.finance.loan;

import com.finance.common.money.MoneyScale;
import com.finance.loan.domain.Loan;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Derives a loan forward from where it stands - its outstanding balance on a date, with
 * a number of EMIs left (V13). Never stored (ADR-0011).
 *
 * <p>Progress is counted by the calendar: an EMI whose due date has passed is treated as
 * paid. There is no way to record a loan payment in the product, so the alternative -
 * counting only recorded payments - left every loan frozen at the day it was entered.
 * The loan's own page says this, and a missed EMI is corrected by editing what's owed.
 *
 * <p>Anything that needs a principal/interest split needs a rate, so {@link #schedule}
 * returns an empty list without one; due dates, EMIs left and the payoff date don't, and
 * are available regardless.
 */
@Component
public class AmortisationCalculator {

    /** A ceiling for the "how many EMIs would this take" walk - 100 years. */
    private static final int MAX_PERIODS = 1200;

    /**
     * The first EMI after the balance date: the stored {@code firstEmiDate} when there is
     * one, otherwise the first EMI day strictly after {@code balanceAsOf}. Strictly after,
     * because an EMI on the balance date itself is already reflected in the balance.
     */
    public LocalDate firstDueDate(Loan loan) {
        if (loan.getFirstEmiDate() != null) {
            return loan.getFirstEmiDate();
        }
        LocalDate asOf = loan.getBalanceAsOf();
        int day = loan.getEmiDay() != null ? loan.getEmiDay() : asOf.getDayOfMonth();
        LocalDate thisMonth = onDay(asOf.withDayOfMonth(1), day);
        return thisMonth.isAfter(asOf) ? thisMonth : onDay(asOf.withDayOfMonth(1).plusMonths(1), day);
    }

    /**
     * EMI number {@code k} after the balance date (k = 1 is the first). Monthly from the
     * first EMI, on the loan's EMI day, clamped to the month's length - an EMI day of 31
     * lands on 28/29 Feb and 30 Apr instead of throwing.
     */
    public LocalDate dueDate(Loan loan, int k) {
        LocalDate first = firstDueDate(loan);
        int day = loan.getEmiDay() != null ? loan.getEmiDay() : first.getDayOfMonth();
        return monthly(first, day, k);
    }

    /** EMI {@code k} (1-based) of a series starting in {@code first}'s month, on {@code day},
     *  clamped to each month's length. */
    public static LocalDate monthly(LocalDate first, int day, int k) {
        return onDay(first.withDayOfMonth(1).plusMonths(k - 1), day);
    }

    /**
     * The EMI a lender charges for these terms: {@code P·r·(1+r)^n / ((1+r)^n − 1)}, with r
     * the monthly rate - or {@code P / n} at 0%. Rounded to the whole rupee, which is how
     * Indian lenders quote EMIs.
     */
    public BigDecimal standardEmi(BigDecimal principal, BigDecimal annualRate, int months) {
        if (months <= 0) {
            return null;
        }
        BigDecimal emi;
        if (annualRate.signum() == 0) {
            emi = principal.divide(BigDecimal.valueOf(months), MathContext.DECIMAL64);
        } else {
            BigDecimal r = annualRate.divide(BigDecimal.valueOf(1200), MathContext.DECIMAL64);
            BigDecimal growth = BigDecimal.ONE.add(r).pow(months, MathContext.DECIMAL64);
            emi = principal.multiply(r).multiply(growth)
                    .divide(growth.subtract(BigDecimal.ONE), MathContext.DECIMAL64);
        }
        return emi.setScale(0, RoundingMode.HALF_UP).setScale(MoneyScale.SCALE);
    }

    /** What's owed after {@code emis} EMIs of {@code emi} on {@code principal} - the same
     *  period-by-period rounding as {@link #schedule}, floored at zero. */
    public BigDecimal balanceAfter(BigDecimal principal, BigDecimal annualRate, BigDecimal emi, int emis) {
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal balance = MoneyScale.normalise(principal);
        for (int k = 1; k <= emis && balance.signum() > 0; k++) {
            BigDecimal interest = MoneyScale.normalise(balance.multiply(monthlyRate));
            BigDecimal principalPart = MoneyScale.normalise(emi.subtract(interest));
            if (principalPart.signum() < 0) {
                principalPart = MoneyScale.ZERO;
            }
            balance = MoneyScale.normalise(balance.subtract(principalPart));
        }
        return balance.signum() < 0 ? MoneyScale.ZERO : balance;
    }

    /** How many of the loan's remaining EMIs have fallen due on or before {@code today}. */
    public int emisElapsed(Loan loan, LocalDate today) {
        int count = 0;
        for (int k = 1; k <= loan.getEmisRemaining(); k++) {
            if (dueDate(loan, k).isAfter(today)) {
                break;
            }
            count++;
        }
        return count;
    }

    /**
     * How many EMIs of this amount it actually takes to clear the outstanding balance at
     * this rate - or -1 if it never does (the EMI doesn't cover the monthly interest).
     * Compared against {@code emisRemaining} to tell the user when the figures they
     * entered don't agree with each other. Requires a rate.
     */
    public int impliedEmis(Loan loan) {
        return impliedEmis(loan.getOutstandingBalance(), loan.getAnnualRate(), loan.getEmi());
    }

    /** {@link #impliedEmis(Loan)} for figures not yet saved as a loan. */
    public int impliedEmis(BigDecimal outstanding, BigDecimal annualRate, BigDecimal emi) {
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal balance = outstanding;
        int count = 0;
        while (balance.signum() > 0) {
            if (count >= MAX_PERIODS) {
                return -1;
            }
            BigDecimal interest = MoneyScale.normalise(balance.multiply(monthlyRate));
            BigDecimal principalPart = emi.subtract(interest);
            if (principalPart.signum() <= 0) {
                return -1;
            }
            balance = balance.subtract(principalPart);
            count++;
        }
        return count;
    }

    /**
     * The remaining schedule, from the balance date forward: one entry per remaining EMI,
     * stopping early if the balance clears. Empty when the rate was never supplied -
     * inventing one, zero included, would produce a schedule that looks authoritative and
     * is fiction.
     *
     * <p>The payment that clears the balance absorbs any rounding remainder, as does the
     * last recorded EMI when what's left is within one EMI. A larger gap is left visible in
     * the final closing balance rather than silently absorbed - it means the EMI, rate and
     * EMIs left disagree, which {@link #impliedEmis} reports.
     */
    public List<AmortisationEntry> schedule(Loan loan) {
        if (loan.getAnnualRate() == null) {
            return List.of();
        }

        int remaining = loan.getEmisRemaining();
        BigDecimal monthlyRate = monthlyRate(loan);
        BigDecimal balance = loan.getOutstandingBalance();
        List<AmortisationEntry> entries = new ArrayList<>(remaining);

        for (int k = 1; k <= remaining && balance.signum() > 0; k++) {
            BigDecimal interest = MoneyScale.normalise(balance.multiply(monthlyRate));
            BigDecimal principalPart = MoneyScale.normalise(loan.getEmi().subtract(interest));

            boolean clears = principalPart.compareTo(balance) >= 0
                    || (k == remaining && balance.subtract(principalPart).abs().compareTo(loan.getEmi()) < 0);
            if (clears) {
                principalPart = balance;
            }
            if (principalPart.signum() < 0) {
                // The EMI doesn't cover the interest - nothing comes off the principal.
                principalPart = BigDecimal.ZERO.setScale(MoneyScale.SCALE);
            }

            balance = MoneyScale.normalise(balance.subtract(principalPart));
            entries.add(new AmortisationEntry(k, dueDate(loan, k), principalPart, interest, balance));
        }
        return entries;
    }

    private BigDecimal monthlyRate(Loan loan) {
        return loan.getAnnualRate().divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
    }

    private static LocalDate onDay(LocalDate monthStart, int day) {
        return monthStart.withDayOfMonth(Math.min(day, monthStart.lengthOfMonth()));
    }
}
