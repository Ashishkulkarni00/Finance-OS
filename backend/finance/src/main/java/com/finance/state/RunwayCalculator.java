package com.finance.state;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.commitment.CommitmentBucket;
import com.finance.commitment.CommitmentBucketClassifier;
import com.finance.commitment.CommitmentMonthlyCost;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.domain.Cycle;
import com.finance.investment.domain.Investment;
import com.finance.investment.InvestmentRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * How many months of mandatory obligations the reachable money would cover.
 *
 * <p>See {@link Runway} for what the figure means and why it is not Real Balance. This class
 * holds the two judgements that decide it:
 *
 * <p><strong>What counts as reachable.</strong> Every asset account, including the ones
 * marked "not spending money" — the emergency fund is the clearest case, and a runway that
 * ignored it would be describing a different question. Investments held in an account marked
 * <em>not liquid</em> (a PPF, an EPF, an FD with a penalty) are excluded: they are real, and
 * they are not money you could reach next month.
 *
 * <p><strong>What counts as essential.</strong> Mandatory commitments that are payments.
 * Optional bills are excluded because they can be skipped, savings because they would stop,
 * and income commitments because the whole premise is that income has stopped.
 *
 * <p>Commitments with no amount yet are left out of the total and counted, and the result is
 * marked an upper bound - see {@link Runway}. Leaving them out can only make the runway look
 * longer than it is, so the figure is reported as a ceiling ("at most"), never as a fact.
 */
@Component
public class RunwayCalculator {

    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final InvestmentRepository investmentRepository;
    private final CommitmentRepository commitmentRepository;
    private final CommitmentBucketClassifier bucketClassifier;
    private final CurrentUserProvider currentUser;

    public RunwayCalculator(AccountService accountService, AccountBalanceCalculator balanceCalculator,
                            InvestmentRepository investmentRepository, CommitmentRepository commitmentRepository,
                            CommitmentBucketClassifier bucketClassifier, CurrentUserProvider currentUser) {
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.investmentRepository = investmentRepository;
        this.commitmentRepository = commitmentRepository;
        this.bucketClassifier = bucketClassifier;
        this.currentUser = currentUser;
    }

    public Runway calculate(Cycle cycle) {
        Provenance.Builder basis = Provenance.of("what you could reach ÷ must-pay bills a month");
        BigDecimal liquid = reachableTotal(basis);
        EssentialTotal essentials = monthlyEssentials(cycle, basis);
        basis.caveat("Day-to-day spending is on top of this - only must-pay bills are counted.");
        basis.caveat("Savings are left out: a SIP or a transfer to the emergency fund would stop.");
        if (essentials.unknownCount() > 0) {
            basis.caveat("Bills with no amount yet are left out, so the real figure is shorter.");
        }

        if (essentials.total().signum() <= 0) {
            // Nothing priced to measure against. Dividing would be a division by zero dressed
            // up as "infinite runway", which is a claim rather than a measurement.
            return Runway.unknown(liquid, essentials.total(), essentials.unknownCount(),
                    essentials.unknownCount() > 0
                            ? "No mandatory bill has an amount yet, so there's nothing to measure against."
                            : "Nothing mandatory is planned yet, so there's nothing to measure against.",
                    basis.build());
        }
        // Rounded DOWN, always: a runway rounded up is a safety figure flattering itself.
        BigDecimal months = liquid.divide(essentials.total(), 1, RoundingMode.DOWN);
        return new Runway(months, essentials.unknownCount() > 0, liquid, essentials.total(),
                essentials.unknownCount(), null, true, basis.build());
    }

    /** Every asset account the user could actually reach, illiquid holdings removed. */
    private BigDecimal reachableTotal(Provenance.Builder basis) {
        basis.section("What you could reach");
        Set<Long> illiquidAccounts = new HashSet<>();
        for (Investment investment : investmentRepository.findByUserIdAndDeletedAtIsNull(currentUser.currentUserId())) {
            if (!investment.isLiquid() && investment.getAccountId() != null) {
                illiquidAccounts.add(investment.getAccountId());
            }
        }
        BigDecimal total = BigDecimal.ZERO;
        for (Account account : accountService.listActive()) {
            if (!account.getType().isAsset()) {
                continue;
            }
            BigDecimal balance = balanceCalculator.currentBalance(account);
            if (illiquidAccounts.contains(account.getId())) {
                // Real, and not money you could reach next month - so it is shown as left out
                // rather than quietly missing from a total that looks complete.
                basis.excluded(account.getName() + " - locked away", Provenance.Ref.Kind.ACCOUNT, account.getId());
                continue;
            }
            basis.line(account.getName(), balance, Provenance.Ref.Kind.ACCOUNT, account.getId());
            total = total.add(balance);
        }
        BigDecimal reached = MoneyScale.normalise(total);
        basis.total(reached);
        return reached;
    }

    private record EssentialTotal(BigDecimal total, int unknownCount) {
    }

    private EssentialTotal monthlyEssentials(Cycle cycle, Provenance.Builder basis) {
        basis.section("Must-pay bills a month");
        List<Commitment> active = commitmentRepository.findActiveForCycle(
                currentUser.currentUserId(), cycle.getStartDate(), cycle.getEndDate());

        BigDecimal total = BigDecimal.ZERO;
        int unknown = 0;
        for (Commitment rule : active) {
            if (!rule.isMandatory() || bucketClassifier.classify(rule) != CommitmentBucket.PAYMENT) {
                continue;
            }
            BigDecimal monthly = CommitmentMonthlyCost.of(rule);
            if (monthly == null) {
                unknown++;
                basis.excluded(rule.getName() + " - no amount yet", Provenance.Ref.Kind.COMMITMENT, rule.getId());
                continue;
            }
            basis.line(rule.getName(), monthly, Provenance.Ref.Kind.COMMITMENT, rule.getId());
            total = total.add(monthly);
        }
        BigDecimal essentials = MoneyScale.normalise(total);
        basis.total(essentials);
        return new EssentialTotal(essentials, unknown);
    }
}
