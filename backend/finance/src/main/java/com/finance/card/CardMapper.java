package com.finance.card;

import com.finance.account.AccountMapper;
import com.finance.card.domain.CardStatement;
import com.finance.card.dto.CardStatementResponse;
import com.finance.card.dto.CreditCardResponse;
import com.finance.card.dto.CreditCardTermsResponse;
import com.finance.card.dto.CreditCardsOverviewResponse;
import com.finance.card.dto.DebitCardResponse;
import com.finance.card.dto.StatementDraftResponse;
import org.springframework.stereotype.Component;

@Component
public class CardMapper {

    private final AccountMapper accountMapper;

    public CardMapper(AccountMapper accountMapper) {
        this.accountMapper = accountMapper;
    }

    public CreditCardTermsResponse toResponse(CreditCardTermsView view) {
        var terms = view.terms();
        return new CreditCardTermsResponse(
                terms.getId(), terms.getAccountId(), terms.getCreditLimit(),
                terms.getStatementDay(), terms.getDueDay(), terms.getNetwork(), terms.getPayFromAccountId(),
                view.outstanding(), view.unbilled(), view.availableCredit());
    }

    public CardStatementResponse toResponse(CardStatement statement) {
        return new CardStatementResponse(
                statement.getId(), statement.getAccountId(), statement.getStatementDate(),
                statement.getDueDate(), statement.getTotalAmount(), statement.getMinimumDue(),
                statement.getEnteredAt());
    }

    public StatementDraftResponse toResponse(StatementDraft draft) {
        return new StatementDraftResponse(draft.statementDate(), draft.dueDate(), draft.totalFromLedger(), draft.alreadyRecorded());
    }

    public CreditCardResponse toResponse(CreditCardView view) {
        var account = view.account();
        var terms = view.terms();
        var latest = view.latestStatement();
        return new CreditCardResponse(
                account.getId(), account.getName(), account.getInstitution(), account.getLastFour(),
                terms == null ? null : terms.getNetwork(),
                terms != null,
                terms == null ? null : terms.getCreditLimit(),
                terms == null ? null : terms.getStatementDay(),
                terms == null ? null : terms.getDueDay(),
                accountMapper.toSummary(view.payFromAccount()),
                view.outstanding(), view.availableCredit(), view.utilisation(), view.emiPrincipalBlocked(), view.unbilled(),
                account.getOpeningAsOf(), view.nextStatementDate(), view.nextStatementDueDate(),
                latest == null ? null : new CreditCardResponse.LatestStatement(
                        latest.statement().getId(), latest.statement().getStatementDate(), latest.statement().getDueDate(),
                        latest.statement().getTotalAmount(), latest.statement().getMinimumDue(),
                        latest.paidSince(), latest.remaining(), latest.minimumDueRemaining(), latest.status()),
                view.emis().stream()
                        .map(e -> new CreditCardResponse.CardEmi(e.loanId(), e.name(), e.emi(), e.nextChargeDate(),
                                e.lastChargeDate(), e.emisLeft()))
                        .toList(),
                view.emiMonthlyTotal());
    }

    public CreditCardsOverviewResponse toResponse(CreditCardsOverview overview) {
        return new CreditCardsOverviewResponse(overview.totalOutstanding(), overview.totalLimit(), overview.totalAvailable(),
                overview.utilisation(), overview.billsDueCount(), overview.billsDueTotal(), overview.emiMonthlyTotal(),
                overview.cards().stream().map(this::toResponse).toList());
    }

    public DebitCardResponse toResponse(DebitCardView view) {
        var card = view.card();
        return new DebitCardResponse(card.getId(), accountMapper.toSummary(view.account()), card.getName(),
                card.getNetwork(), card.getLastFour(), card.getCreatedAt());
    }
}
