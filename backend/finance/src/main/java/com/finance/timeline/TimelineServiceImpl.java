package com.finance.timeline;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.card.CardStatementRepository;
import com.finance.card.domain.CardStatement;
import com.finance.commitment.CommitmentInstanceRepository;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.common.user.CurrentUserProvider;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.AmortisationEntry;
import com.finance.loan.LoanRepository;
import com.finance.loan.domain.Loan;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Assembles the timeline from three independent sources - commitment instances, card
 * statements, loan EMIs - and sorts by due date. No new table: everything here is
 * either already stored elsewhere or generated live (the amortisation schedule).
 *
 * <p>A commitment modelling the same obligation as a card statement (e.g. "pay the
 * HDFC bill") can appear twice - the two features are independent and this does not
 * attempt to deduplicate between them. Documented limitation, not an oversight.
 */
@Service
public class TimelineServiceImpl implements TimelineService {

    private final CommitmentInstanceRepository instanceRepository;
    private final CommitmentRepository commitmentRepository;
    private final CardStatementRepository cardStatementRepository;
    private final com.finance.card.CreditCardService creditCardService;
    private final LoanRepository loanRepository;
    private final AmortisationCalculator amortisationCalculator;
    private final AccountService accountService;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public TimelineServiceImpl(CommitmentInstanceRepository instanceRepository,
                               CommitmentRepository commitmentRepository,
                               CardStatementRepository cardStatementRepository,
                               com.finance.card.CreditCardService creditCardService,
                               LoanRepository loanRepository,
                               AmortisationCalculator amortisationCalculator,
                               AccountService accountService,
                               CurrentUserProvider currentUser,
                               Clock clock) {
        this.instanceRepository = instanceRepository;
        this.commitmentRepository = commitmentRepository;
        this.cardStatementRepository = cardStatementRepository;
        this.creditCardService = creditCardService;
        this.loanRepository = loanRepository;
        this.amortisationCalculator = amortisationCalculator;
        this.accountService = accountService;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimelineItem> upcoming(int days) {
        Long userId = currentUser.currentUserId();
        LocalDate today = LocalDate.now(clock);
        LocalDate to = today.plusDays(Math.max(days, 0));

        List<TimelineItem> items = new ArrayList<>();
        items.addAll(commitmentItems(userId, today, to));
        items.addAll(cardStatementItems(userId, today, to));
        items.addAll(loanEmiItems(userId, today, to));

        return items.stream().sorted(Comparator.comparing(TimelineItem::dueDate)).toList();
    }

    private List<TimelineItem> commitmentItems(Long userId, LocalDate from, LocalDate to) {
        List<TimelineItem> items = new ArrayList<>();
        for (CommitmentInstance instance : instanceRepository.findOpenDueBetween(userId, from, to)) {
            Commitment commitment = commitmentRepository.findById(instance.getCommitmentId()).orElse(null);
            if (commitment == null) {
                continue;
            }
            java.math.BigDecimal amount = instance.outstanding();
            TimelineItemType type = commitment.getSettleAs() == com.finance.transaction.domain.TransactionType.INCOME
                    ? TimelineItemType.INCOME : TimelineItemType.COMMITMENT;
            items.add(new TimelineItem(type, instance.getId(), commitment.getName(),
                    instance.getDueDate(), amount, accountName(commitment.getAccountId()), commitment.getAccountId()));
        }
        return items;
    }

    private List<TimelineItem> cardStatementItems(Long userId, LocalDate from, LocalDate to) {
        List<TimelineItem> items = new ArrayList<>();
        for (CardStatement statement : cardStatementRepository.findByUserIdAndDueDateBetween(userId, from, to)) {
            // What's still to pay, not the statement's total - a bill already paid (or part
            // paid) used to be listed as if nothing had gone toward it.
            java.math.BigDecimal remaining = creditCardService.remainingOn(statement);
            if (remaining.signum() == 0) {
                continue;
            }
            items.add(new TimelineItem(TimelineItemType.CARD_STATEMENT, statement.getId(), "Card bill",
                    statement.getDueDate(), remaining, accountName(statement.getAccountId()), statement.getAccountId()));
        }
        return items;
    }

    private List<TimelineItem> loanEmiItems(Long userId, LocalDate from, LocalDate to) {
        List<TimelineItem> items = new ArrayList<>();
        for (Loan loan : loanRepository.findByUserIdAndDeletedAtIsNull(userId)) {
            // A card EMI isn't a payment of its own - it's charged to the card and paid through
            // the card's bill, which is listed above. Listing it too showed the money twice.
            if (loan.getStatus() == com.finance.loan.domain.LoanStatus.CLOSED
                    || loan.getPaidVia() == com.finance.loan.domain.LoanPaidVia.CARD) {
                continue;
            }
            // A plan bill already pays this EMI and is listed as a bill - once is enough
            // (FIX_BACKLOG 1.3).
            if (!commitmentRepository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                    com.finance.commitment.domain.CommitmentSource.LOAN, loan.getId(), userId).isEmpty()) {
                continue;
            }
            // The loan's remaining EMIs, from where it stands (V13) - not the original
            // tenure, which listed EMIs a long-running loan had already paid. Walks the due
            // dates directly rather than the schedule, which is empty without a rate even
            // though the EMI amount and its day are known. Dates ascend with k, so once one
            // passes the window every later one does too.
            for (int k = 1; k <= loan.getEmisRemaining(); k++) {
                LocalDate due = amortisationCalculator.dueDate(loan, k);
                if (due.isBefore(from)) {
                    continue;
                }
                if (due.isAfter(to)) {
                    break;
                }
                items.add(new TimelineItem(TimelineItemType.LOAN_EMI, loan.getId(),
                        loan.getLender() + " EMI", due, loan.getEmi(), accountName(loan.getAccountId()),
                        loan.getAccountId()));
            }
        }
        return items;
    }

    private String accountName(Long accountId) {
        Account account = accountService.getByIdIncludingDeleted(accountId);
        return account.getName();
    }
}
