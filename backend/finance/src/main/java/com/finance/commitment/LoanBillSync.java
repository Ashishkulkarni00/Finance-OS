package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanStatus;
import com.finance.transaction.domain.TransactionType;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

/**
 * Copies a loan's EMI terms onto the bill that pays it.
 *
 * <p>The loan is the one place the user states the EMI, its day, the account it leaves
 * and how many are left. A linked bill takes all of that from the loan every time the
 * loan or the bill is saved, so the two can't disagree - the plan used to hold a second,
 * hand-typed copy that drifted (FIX_BACKLOG 1.2). The bill keeps what is its own: name,
 * category, notes, must-pay, and its start, so a linked bill's history stays intact.
 */
@Component
public class LoanBillSync {

    /** A bill's due day is 1-28 (the salary cycle's own limit). An EMI on the 29th-31st
     *  is planned on the 28th - a day or two early, which reserves the money in time. */
    private static final int LAST_PLANNABLE_DAY = 28;

    private final AmortisationCalculator calculator;
    private final Clock clock;

    public LoanBillSync(AmortisationCalculator calculator, Clock clock) {
        this.calculator = calculator;
        this.clock = clock;
    }

    /** The first due date a new bill for this loan should cover: the next EMI not yet
     *  reflected in the loan's stated balance. */
    public LocalDate firstDueDate(Loan loan) {
        return calculator.firstDueDate(loan);
    }

    public void apply(Commitment bill, Loan loan) {
        if (loan.getPayFromAccountId() == null) {
            throw new BusinessRuleException(ErrorCode.LOAN_HAS_NO_PAY_FROM,
                    "Choose which account pays this loan's EMI first, then add it to the plan.");
        }
        bill.setAmountType(CommitmentAmountType.FIXED);
        bill.setFixedAmount(loan.getEmi());
        bill.setFrequency(CommitmentFrequency.MONTHLY);
        bill.setDueDay(Math.min(emiDay(loan), LAST_PLANNABLE_DAY));
        bill.setAccountId(loan.getPayFromAccountId());
        // An EMI is paid like any bill - as an expense, from the bank or on the card.
        bill.setSettleAs(TransactionType.EXPENSE);

        LocalDate today = LocalDate.now(clock);
        boolean ended = loan.getStatus() == LoanStatus.CLOSED || loan.isDeleted() || loan.getEmisRemaining() <= 0;
        LocalDate lastEmi = ended ? today : calculator.dueDate(loan, loan.getEmisRemaining());
        bill.setActiveTo(lastEmi.isBefore(bill.getActiveFrom()) ? bill.getActiveFrom().minusDays(1) : lastEmi);
    }

    private int emiDay(Loan loan) {
        return loan.getEmiDay() != null ? loan.getEmiDay() : calculator.firstDueDate(loan).getDayOfMonth();
    }
}
