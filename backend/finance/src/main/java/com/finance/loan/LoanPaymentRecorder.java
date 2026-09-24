package com.finance.loan;

import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanPayment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Files a settled EMI against the period it paid - the evidence a loan's balance is derived
 * from (Phase 1.2, ROADMAP 1.2).
 *
 * <p>Before this, `loan_payments` had existed unused since V5 and a loan's progress was
 * counted by the calendar, so a loan shrank whether or not you had actually paid it. The
 * only way to correct a missed EMI was to retype what was owed.
 *
 * <p>Joins the caller's transaction ({@code MANDATORY}): the settlement and its record are
 * one fact. A settle that succeeded while its payment record failed would put the loan
 * right back to guessing.
 *
 * <p>Never throws on a problem it can't fix. Recording a payment is a consequence of
 * settling a bill, not the point of it - a loan whose EMI dates don't line up must not stop
 * the user marking their rent paid. Those cases are logged and left unrecorded, which the
 * loan page then reports as an unrecorded EMI.
 */
@Component
public class LoanPaymentRecorder {

    private static final Logger log = LoggerFactory.getLogger(LoanPaymentRecorder.class);

    private final LoanPaymentRepository repository;
    private final LoanRepository loanRepository;
    private final AmortisationCalculator calculator;
    private final Clock clock;

    public LoanPaymentRecorder(LoanPaymentRepository repository,
                               LoanRepository loanRepository,
                               AmortisationCalculator calculator,
                               Clock clock) {
        this.repository = repository;
        this.loanRepository = loanRepository;
        this.calculator = calculator;
        this.clock = clock;
    }

    /**
     * Records that {@code transactionId} paid the EMI due on {@code dueDate}.
     *
     * @return true when a payment was written
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean record(Long loanId, Long userId, LocalDate dueDate, Long transactionId) {
        Loan loan = loanRepository.findByIdAndUserIdAndDeletedAtIsNull(loanId, userId).orElse(null);
        if (loan == null) {
            return false;
        }
        // One transaction pays one EMI - the same money can't clear two periods (rule 4).
        if (repository.findByTransactionIdAndUserId(transactionId, userId).isPresent()) {
            return false;
        }
        int period = calculator.periodFor(loan, dueDate);
        if (period < 1) {
            // The bill's due date isn't one of this loan's EMI dates - the two have drifted,
            // or the loan's terms were edited after the occurrence was generated.
            log.info("Loan payment not recorded: due date is not an EMI date loanId={} period={}", loanId, period);
            return false;
        }
        // The unique key is (loan, period); a re-settled month must not write a second row.
        if (repository.findByLoanIdAndPeriodNumberAndUserId(loanId, period, userId).isPresent()) {
            return false;
        }

        repository.save(LoanPayment.builder()
                .userId(userId)
                .loanId(loanId)
                .periodNumber(period)
                .transactionId(transactionId)
                .paidAt(Instant.now(clock))
                .build());
        // No amount and no name in the log - ADR-0010.
        log.info("Loan payment recorded loanId={} period={}", loanId, period);
        return true;
    }
}
