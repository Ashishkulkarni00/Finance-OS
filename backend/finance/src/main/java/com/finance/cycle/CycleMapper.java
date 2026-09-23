package com.finance.cycle;

import com.finance.cycle.domain.Cycle;
import com.finance.cycle.domain.CycleSnapshot;
import com.finance.cycle.dto.CategorySpendResponse;
import com.finance.cycle.dto.CycleResponse;
import com.finance.cycle.dto.CycleSnapshotResponse;
import com.finance.cycle.dto.CycleSummaryResponse;
import com.finance.cycle.dto.FlexibleSpendingResponse;
import org.springframework.stereotype.Component;

@Component
public class CycleMapper {

    public CycleResponse toResponse(Cycle cycle) {
        return new CycleResponse(
                cycle.getId(), cycle.getStartDate(), cycle.getEndDate(), cycle.label(),
                cycle.isClosed(), cycle.getClosedAt());
    }

    public CycleSummaryResponse toResponse(CycleSummary summary) {
        return new CycleSummaryResponse(summary.incomeTotal(), summary.expenseTotal(), summary.investedTotal(),
                summary.transferredTotal(), summary.net(), summary.savingsRate());
    }

    public CycleSnapshotResponse toResponse(CycleSnapshot snapshot) {
        return new CycleSnapshotResponse(
                snapshot.getId(), snapshot.getCycleId(),
                snapshot.getIncomeTotal(), snapshot.getExpenseTotal(),
                snapshot.getInvestedTotal(), snapshot.getTransferredTotal(),
                snapshot.getNet(), snapshot.getSavingsRate(),
                snapshot.getRealBalance(), snapshot.getNetWorth(), snapshot.getTotalDebt(),
                snapshot.getPlannedCommittedTotal(), snapshot.getActualCommittedTotal(),
                snapshot.getCommitmentsPlanned(), snapshot.getCommitmentsKept(),
                snapshot.getPlanRevisionsCount(),
                snapshot.getCreatedAt());
    }

    public CategorySpendResponse toResponse(CategorySpend spend) {
        return new CategorySpendResponse(spend.categoryId(), spend.categoryName(), spend.categoryGroup(),
                spend.amount(), spend.share());
    }

    public FlexibleSpendingResponse toResponse(FlexibleSpending spending) {
        return new FlexibleSpendingResponse(
                spending.total(),
                spending.categories().stream().map(this::toResponse).toList());
    }
}
