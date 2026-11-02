package com.finance.review;

import com.finance.review.dto.DebtTrajectoryResponse;
import com.finance.review.dto.MonthCategoriesResponse;
import com.finance.review.dto.MonthReviewResponse;
import org.springframework.stereotype.Component;

/** Domain to wire. Entities are never serialised (BACKEND_CONVENTIONS); nor are records
 *  that carry one. */
@Component
public class ReviewMapper {

    public MonthReviewResponse toResponse(ReviewResult result) {
        return new MonthReviewResponse(
                result.asOf(),
                result.months().stream().map(this::toMonth).toList(),
                result.monthsRecorded(),
                toSamePoint(result.samePoint()));
    }

    private MonthReviewResponse.Month toMonth(MonthReview month) {
        return new MonthReviewResponse.Month(
                month.cycleId(), month.startDate(), month.endDate(), month.label(),
                month.current(), month.closed(), month.recorded(), month.planTracked(),
                month.elapsedShare(),
                month.income(), month.spend(), month.committed(), month.flexible(),
                month.invested(), month.net(), month.leftOver(),
                month.savingsRate(), month.committedShare(),
                month.commitmentsPlanned(), month.commitmentsKept(),
                month.plannedCommittedTotal(), month.actualCommittedTotal());
    }

    private MonthReviewResponse.SamePoint toSamePoint(SamePointComparison samePoint) {
        return samePoint == null ? null : new MonthReviewResponse.SamePoint(
                samePoint.previousCycleId(), samePoint.previousLabel(), samePoint.daysIn(),
                samePoint.cutOff(), samePoint.previousSpend(), samePoint.spendChange(),
                samePoint.previousIncome(), samePoint.incomeChange());
    }

    public MonthCategoriesResponse toResponse(MonthCategories categories) {
        return new MonthCategoriesResponse(
                categories.cycleId(), categories.label(), categories.startDate(), categories.endDate(),
                categories.recorded(), categories.planTracked(),
                categories.spend(), categories.committed(), categories.flexible(),
                categories.categories().stream()
                        .map(line -> new MonthCategoriesResponse.Line(line.categoryId(), line.name(),
                                line.group(), line.total(), line.committed(), line.flexible(),
                                line.share(), line.shareOfFlexible()))
                        .toList());
    }

    public DebtTrajectoryResponse toResponse(DebtTrajectory trajectory) {
        return new DebtTrajectoryResponse(
                trajectory.asOf(), trajectory.outstandingNow(), trajectory.debtFreeDate(),
                trajectory.monthsToDebtFree(), trajectory.interestAhead(), trajectory.unrecordedEmis(),
                trajectory.points().stream()
                        .map(point -> new DebtTrajectoryResponse.Point(point.month(), point.outstanding(),
                                point.principalDue(), point.interestDue()))
                        .toList(),
                trajectory.series().stream()
                        .map(s -> new DebtTrajectoryResponse.Series(s.loanId(), s.name(), s.balances()))
                        .toList(),
                trajectory.loans().stream()
                        .map(loan -> new DebtTrajectoryResponse.Loan(loan.loanId(), loan.name(),
                                loan.outstanding(), loan.emi(), loan.payoffDate(), loan.inCurve()))
                        .toList(),
                trajectory.excludedLoanCount(), trajectory.excludedOutstanding());
    }
}
