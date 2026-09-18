package com.finance.investment;

import com.finance.investment.dto.CreateInvestmentRequest;
import com.finance.investment.dto.RecordValuationRequest;
import com.finance.investment.dto.UpdateInvestmentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Investment use cases. */
public interface InvestmentService {

    InvestmentView create(CreateInvestmentRequest request);

    InvestmentView getById(Long id);

    Page<InvestmentView> list(Pageable pageable);

    InvestmentView update(Long id, UpdateInvestmentRequest request);

    /**
     * The screen's primary action: "here's what it's worth today". Stamps the as-of date
     * itself so a value can never be recorded without one - a valuation nobody can date
     * looks current when it isn't.
     */
    InvestmentView recordValuation(Long id, RecordValuationRequest request);

    void delete(Long id);

    InvestmentSummary summary();
}
