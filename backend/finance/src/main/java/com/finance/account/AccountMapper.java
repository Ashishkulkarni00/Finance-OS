package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.account.domain.BalanceConfidence;
import com.finance.account.dto.AccountHoldResponse;
import com.finance.account.dto.AccountResponse;
import com.finance.account.dto.AccountSummary;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.common.money.MoneyScale;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Entity to DTO, by hand.
 *
 * <p>Written rather than generated: money and derived fields need deliberate
 * handling, and a generated mapper hides exactly the kind of silently dropped field
 * that would corrupt a balance.
 */
@Component
public class AccountMapper {

    private final AccountBalanceCalculator balanceCalculator;
    private final AccountAvailableCalculator availableCalculator;

    public AccountMapper(AccountBalanceCalculator balanceCalculator, AccountAvailableCalculator availableCalculator) {
        this.balanceCalculator = balanceCalculator;
        this.availableCalculator = availableCalculator;
    }

    public Account toEntity(CreateAccountRequest request, Long userId) {
        return Account.builder()
                .userId(userId)
                .name(request.name().trim())
                .type(request.type())
                .institution(trimToNull(request.institution()))
                .lastFour(trimToNull(request.lastFour()))
                .currency(request.currency() == null ? "INR" : request.currency())
                .openingBalance(MoneyScale.normalise(request.openingBalance()))
                .openingAsOf(request.openingAsOf())
                .openingConfidence(request.openingConfidence() == null
                        ? BalanceConfidence.CONFIRMED : request.openingConfidence())
                .minimumBalance(MoneyScale.normalise(request.minimumBalance()))
                .minimumBalanceMandatory(Boolean.TRUE.equals(request.minimumBalanceMandatory()))
                .includeInSpendable(request.includeInSpendable() == null
                        ? request.type().isSpendable() : request.includeInSpendable())
                .includeInNetWorth(request.includeInNetWorth() == null
                        || request.includeInNetWorth())
                .purpose(trimToNull(request.purpose()))
                .displayOrder(request.displayOrder() == null ? 0 : request.displayOrder())
                .build();
    }

    public AccountResponse toResponse(Account account) {
        BigDecimal balance = balanceCalculator.currentBalance(account);
        AccountHold hold = availableCalculator.hold(account);

        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getType(),
                humanise(account.getType()),
                account.getInstitution(),
                account.getLastFour(),
                account.getCurrency(),
                account.getOpeningBalance(),
                account.getOpeningAsOf(),
                account.getOpeningConfidence(),
                balance,
                balanceCalculator.balanceAsOf(account),
                availableCalculator.available(balance, hold),
                new AccountHoldResponse(hold.reserved(), hold.minimumHold(), hold.locked(), hold.reservedFor()),
                account.getMinimumBalance(),
                account.isMinimumBalanceMandatory(),
                isBelowMinimum(account, balance),
                account.isIncludeInSpendable(),
                account.isIncludeInNetWorth(),
                account.countsAsSpendable(),
                account.getType().isAsset(),
                account.getType().isLiability(),
                account.getPurpose(),
                account.getDisplayOrder(),
                account.isArchived(),
                account.getArchivedAt(),
                account.getCreatedAt(),
                account.getUpdatedAt(),
                // Reads report no effect; a write attaches its own (ADR-0017).
                null
        );
    }

    public AccountSummary toSummary(Account account) {
        if (account == null) {
            return null;
        }
        return new AccountSummary(account.getId(), account.getName(), account.getType());
    }

    private boolean isBelowMinimum(Account account, BigDecimal balance) {
        if (account.getMinimumBalance() == null || balance == null) {
            return false;
        }
        return balance.compareTo(account.getMinimumBalance()) < 0;
    }

    /** "CREDIT_CARD" -> "Credit card". Labels are plain language, never SCREAMING_CASE. */
    private String humanise(com.finance.account.domain.AccountType type) {
        String words = type.name().toLowerCase().replace('_', ' ');
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
