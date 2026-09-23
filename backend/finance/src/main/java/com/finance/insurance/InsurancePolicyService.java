package com.finance.insurance;

import com.finance.insurance.dto.CreateInsurancePolicyRequest;
import com.finance.insurance.dto.UpdateInsurancePolicyRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Being covered - see {@code InsurancePolicy}. */
public interface InsurancePolicyService {

    InsurancePolicyView create(CreateInsurancePolicyRequest request);

    InsurancePolicyView getById(Long id);

    Page<InsurancePolicyView> list(boolean includeArchived, Pageable pageable);

    InsurancePolicyView update(Long id, UpdateInsurancePolicyRequest request);

    InsurancePolicyView archive(Long id);

    InsurancePolicyView unarchive(Long id);

    void delete(Long id);

    InsuranceSummary summary();
}
