package com.finance.commitment;

import com.finance.account.AccountMapper;
import com.finance.category.CategoryMapper;
import com.finance.commitment.domain.AttentionTier;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.dto.CommitmentInstanceDetailResponse;
import com.finance.commitment.dto.CommitmentInstanceHistoryEntry;
import com.finance.commitment.dto.CommitmentInstanceResponse;
import com.finance.commitment.dto.CommitmentPlanProgressResponse;
import com.finance.commitment.dto.CommitmentResponse;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.CycleStandingResponse;
import com.finance.common.money.MoneyScale;
import com.finance.transaction.TransactionMapper;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Component
public class CommitmentMapper {

    private final AccountMapper accountMapper;
    private final CategoryMapper categoryMapper;
    private final TransactionMapper transactionMapper;
    private final Clock clock;

    public CommitmentMapper(AccountMapper accountMapper, CategoryMapper categoryMapper,
                            TransactionMapper transactionMapper, Clock clock) {
        this.accountMapper = accountMapper;
        this.categoryMapper = categoryMapper;
        this.transactionMapper = transactionMapper;
        this.clock = clock;
    }

    public Commitment toEntity(CreateCommitmentRequest request, Long userId) {
        return Commitment.builder()
                .userId(userId)
                .name(request.name().trim())
                .amountType(request.amountType())
                .fixedAmount(request.fixedAmount())
                .frequency(request.frequency())
                .dueDay(request.dueDay())
                .accountId(request.accountId())
                .categoryId(request.categoryId())
                .mandatory(request.mandatory() == null || request.mandatory())
                .requiresVerification(Boolean.TRUE.equals(request.requiresVerification()))
                .activeFrom(request.activeFrom())
                .activeTo(request.activeTo())
                .why(trimToNull(request.why()))
                .ifSkipped(trimToNull(request.ifSkipped()))
                .settleAs(request.settleAs() != null ? request.settleAs() : com.finance.transaction.domain.TransactionType.EXPENSE)
                .toAccountId(request.toAccountId())
                .sourceType(request.sourceType() != null ? request.sourceType() : com.finance.commitment.domain.CommitmentSource.MANUAL)
                .sourceId(request.sourceId())
                .build();
    }

    public CommitmentResponse toResponse(CommitmentView view) {
        Commitment c = view.commitment();
        return new CommitmentResponse(
                c.getId(), c.getName(), c.getAmountType(), c.getFixedAmount(),
                c.getFrequency(), c.getDueDay(),
                accountMapper.toSummary(view.account()), categoryMapper.toSummary(view.category()),
                c.getSourceType(), c.getSourceId(), c.getSettleAs(), c.getToAccountId(),
                c.isMandatory(), c.isRequiresVerification(),
                c.getActiveFrom(), c.getActiveTo(),
                c.getWhy(), c.getIfSkipped(),
                c.isArchived(), c.getArchivedAt(), c.getCreatedAt(), c.getUpdatedAt(),
                // Reads report no effect; a write attaches its own (ADR-0017).
                null);
    }

    public CommitmentInstanceResponse toResponse(CommitmentInstanceView view) {
        CommitmentInstance instance = view.instance();
        Commitment commitment = view.commitment();
        return new CommitmentInstanceResponse(
                instance.getId(), instance.getCommitmentId(), commitment.getName(), instance.getCycleId(),
                instance.getDueDate(), instance.getExpectedAmount(), instance.getStatus(),
                instance.getConfirmedAmount(), instance.outstanding(), instance.getConfirmedAt(), view.settledOn(),
                instance.getLinkedTransactionId(), commitment.isMandatory(), commitment.getIfSkipped(),
                accountMapper.toSummary(view.account()), categoryMapper.toSummary(view.category()),
                commitment.getSourceType(), commitment.getSourceId(), commitment.getSettleAs(), commitment.getToAccountId(),
                AttentionTier.of(instance, commitment, LocalDate.now(clock)), instance.variance(),
                // Reads report no effect; a write attaches its own (ADR-0017).
                null);
    }

    public CommitmentPlanProgressResponse toResponse(CommitmentPlanProgress progress) {
        return new CommitmentPlanProgressResponse(
                progress.settledCount(), progress.settledTotal(), progress.totalCount(), progress.plannedTotal(),
                progress.needsYouCount(), progress.needsYouTotal(),
                progress.upcomingCount(), progress.upcomingTotal(),
                progress.byCategory().stream()
                        .map(g -> new CommitmentPlanProgressResponse.CategoryGroup(
                                categoryMapper.toSummary(g.category()), g.count(),
                                MoneyScale.normalise(g.plannedTotal()), MoneyScale.normalise(g.outstandingTotal())))
                        .toList(),
                progress.incomeCount(), progress.incomeExpectedTotal(), progress.incomeReceivedTotal(),
                progress.byDueDate().stream()
                        .map(g -> new CommitmentPlanProgressResponse.DueDateGroup(g.dueDate(), g.count(),
                                MoneyScale.normalise(g.plannedTotal()), MoneyScale.normalise(g.outstandingTotal())))
                        .toList());
    }

    public com.finance.commitment.dto.CycleShapeResponse toResponse(CycleShape shape) {
        return new com.finance.commitment.dto.CycleShapeResponse(
                shape.state(), shape.expectedIn(), shape.incomeStillExpected(), shape.committed(), shape.plannedSavings(),
                shape.flexible(), shape.unknownAmountCount(), shape.spent(), shape.spentShare(), shape.cycleElapsed());
    }

    public CycleStandingResponse toResponse(CycleStanding standing) {
        return new CycleStandingResponse(
                standing.incomeTotal(), standing.incomeExpectedTotal(), standing.committedTotal(), standing.uncommittedTotal(), standing.committedShare());
    }

    public CommitmentInstanceDetailResponse toDetailResponse(CommitmentInstanceDetailView view) {
        CommitmentInstance instance = view.instance();
        Commitment commitment = view.commitment();
        var linkedTransaction = view.linkedTransaction();
        return new CommitmentInstanceDetailResponse(
                instance.getId(), instance.getDueDate(), instance.getExpectedAmount(), instance.getStatus(),
                instance.getConfirmedAmount(), instance.outstanding(), instance.getConfirmedAt(),
                AttentionTier.of(instance, commitment, LocalDate.now(clock)), instance.variance(),
                commitment.getId(), commitment.getName(), commitment.getWhy(), commitment.getIfSkipped(),
                commitment.getAmountType(), commitment.getFixedAmount(), commitment.getFrequency(), commitment.getDueDay(),
                commitment.isMandatory(), commitment.isRequiresVerification(),
                accountMapper.toSummary(view.account()), categoryMapper.toSummary(view.category()),
                commitment.getSourceType(), commitment.getSourceId(), commitment.getSettleAs(), commitment.getToAccountId(),
                linkedTransaction == null ? null : transactionMapper.toResponse(
                        linkedTransaction.transaction(), linkedTransaction.account(),
                        linkedTransaction.toAccount(), linkedTransaction.category()),
                toHistoryEntries(view.history()));
    }

    public List<CommitmentInstanceHistoryEntry> toHistoryEntries(List<CommitmentInstance> instances) {
        return instances.stream()
                .map(h -> new CommitmentInstanceHistoryEntry(h.getId(), h.getCycleId(), h.getDueDate(), h.getStatus(), h.getConfirmedAmount()))
                .toList();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
