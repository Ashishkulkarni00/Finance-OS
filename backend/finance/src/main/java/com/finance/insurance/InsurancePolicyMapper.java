package com.finance.insurance;

import com.finance.insurance.domain.InsurancePolicy;
import com.finance.insurance.dto.InsurancePolicyResponse;
import com.finance.insurance.dto.InsuranceSummaryResponse;
import org.springframework.stereotype.Component;

@Component
public class InsurancePolicyMapper {

    public InsurancePolicyResponse toResponse(InsurancePolicyView view) {
        InsurancePolicy p = view.policy();
        return new InsurancePolicyResponse(
                p.getId(), p.getType(), p.getType().label(), p.getName(), p.getInsurer(), p.getPolicyLastFour(),
                p.getCoverAmount(), p.getPremium(), p.getPremiumFrequency(), view.monthlyCost(),
                p.getRenewsOn(), p.getStartedOn(), view.status(), view.daysToRenewal(),
                p.getCovers(), p.getNote(), p.getLoanId(), view.premiumCommitmentId(),
                p.isArchived(), p.getArchivedAt(), p.getCreatedAt(), p.getUpdatedAt());
    }

    public InsuranceSummaryResponse toResponse(InsuranceSummary summary) {
        return new InsuranceSummaryResponse(summary.policies(), summary.totalCover(), summary.monthlyPremium(),
                summary.lapsed(), summary.renewingSoon(), summary.unknownRenewal());
    }
}
