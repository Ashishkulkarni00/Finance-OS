package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.goal.GoalRepository;
import com.finance.goal.domain.Goal;
import com.finance.investment.InvestmentRepository;
import com.finance.investment.domain.Investment;
import com.finance.loan.LoanRepository;
import com.finance.transaction.domain.TransactionType;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

/**
 * Applies what a bill follows to the bill - the one place that knows which figures belong
 * to the source and which to the bill.
 *
 * <ul>
 *   <li><strong>Loan</strong>: EMI, day, paying account and last payment (see {@link LoanBillSync});
 *       paid as an expense.</li>
 *   <li><strong>Investment</strong> (a SIP or RD): the monthly amount, its day and the account
 *       it leaves; paid as an INVESTMENT into the holding's account. A holding kept outside the
 *       Ledger has no account to invest into, so its instalment is paid as an expense.</li>
 *   <li><strong>Goal</strong>: only where the money goes - the goal's account - paid as a
 *       TRANSFER. How much and when is the bill's own decision; the goal only says what
 *       it's for.</li>
 * </ul>
 *
 * A source that has been deleted, closed or archived ends the bill today rather than
 * leaving it asking for payments. Reads include deleted rows for exactly that reason.
 */
@Component
public class SourceBillSync {

    private static final int LAST_PLANNABLE_DAY = 28;

    private final LoanRepository loanRepository;
    private final InvestmentRepository investmentRepository;
    private final GoalRepository goalRepository;
    private final LoanBillSync loanBillSync;
    private final Clock clock;

    public SourceBillSync(LoanRepository loanRepository, InvestmentRepository investmentRepository,
                          GoalRepository goalRepository, LoanBillSync loanBillSync, Clock clock) {
        this.loanRepository = loanRepository;
        this.investmentRepository = investmentRepository;
        this.goalRepository = goalRepository;
        this.loanBillSync = loanBillSync;
        this.clock = clock;
    }

    /** Throws 404 unless the source exists, is the user's and isn't deleted - for linking. */
    public void requireLinkable(CommitmentSource type, Long id, Long userId) {
        boolean exists = switch (type) {
            case LOAN -> loanRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId).isPresent();
            case INVESTMENT -> investmentRepository.findById(id)
                    .filter(i -> i.getUserId().equals(userId) && !i.isDeleted()).isPresent();
            case GOAL -> goalRepository.findById(id)
                    .filter(g -> g.getUserId().equals(userId) && !g.isDeleted()).isPresent();
            case MANUAL -> true;
        };
        if (!exists) {
            throw new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "We couldn't find what this bill should follow.",
                    "sourceId");
        }
    }

    /** Re-applies the bill's source to it. A MANUAL bill is left as it is. */
    public void apply(Commitment bill) {
        Long userId = bill.getUserId();
        switch (bill.getSourceType()) {
            case LOAN -> loanRepository.findById(bill.getSourceId())
                    .filter(l -> l.getUserId().equals(userId))
                    .ifPresent(loan -> {
                        loanBillSync.apply(bill, loan);
                        bill.setToAccountId(null);
                    });
            case INVESTMENT -> investmentRepository.findById(bill.getSourceId())
                    .filter(i -> i.getUserId().equals(userId))
                    .ifPresent(investment -> applyInvestment(bill, investment));
            case GOAL -> goalRepository.findById(bill.getSourceId())
                    .filter(g -> g.getUserId().equals(userId))
                    .ifPresent(goal -> applyGoal(bill, goal));
            case MANUAL -> {
                // Its figures are the user's.
            }
        }
    }

    private void applyInvestment(Commitment bill, Investment investment) {
        if (investment.getMonthlyContribution() == null || investment.getPayFromAccountId() == null) {
            throw new BusinessRuleException(ErrorCode.SOURCE_NOT_SUPPORTED,
                    "Give this holding a monthly amount and the account it's paid from first.", "sourceId");
        }
        bill.setAmountType(CommitmentAmountType.FIXED);
        bill.setFixedAmount(investment.getMonthlyContribution());
        bill.setFrequency(CommitmentFrequency.MONTHLY);
        int day = investment.getContributionDay() != null ? investment.getContributionDay() : bill.getDueDay();
        bill.setDueDay(Math.max(1, Math.min(day, LAST_PLANNABLE_DAY)));
        bill.setAccountId(investment.getPayFromAccountId());
        if (investment.getAccountId() != null) {
            bill.setSettleAs(TransactionType.INVESTMENT);
            bill.setToAccountId(investment.getAccountId());
        } else {
            bill.setSettleAs(TransactionType.EXPENSE);
            bill.setToAccountId(null);
        }
        if (investment.isDeleted()) {
            endToday(bill);
        }
    }

    private void applyGoal(Commitment bill, Goal goal) {
        if (goal.getLinkedAccountId() == null) {
            throw new BusinessRuleException(ErrorCode.SOURCE_NOT_SUPPORTED,
                    "This goal isn't kept in an account, so there's nowhere to move the money to.", "sourceId");
        }
        if (goal.getLinkedAccountId().equals(bill.getAccountId())) {
            throw new BusinessRuleException(ErrorCode.SOURCE_NOT_SUPPORTED,
                    "The money would move into the account it leaves. Pick a different account to pay from.", "accountId");
        }
        bill.setSettleAs(TransactionType.TRANSFER);
        bill.setToAccountId(goal.getLinkedAccountId());
        if (goal.isDeleted() || goal.isArchived()) {
            endToday(bill);
        }
    }

    private void endToday(Commitment bill) {
        LocalDate today = LocalDate.now(clock);
        if (bill.getActiveTo() == null || bill.getActiveTo().isAfter(today)) {
            bill.setActiveTo(today.isBefore(bill.getActiveFrom()) ? bill.getActiveFrom().minusDays(1) : today);
        }
    }
}
