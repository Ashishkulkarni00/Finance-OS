package com.finance.card;

import com.finance.card.domain.CreditCardTerms;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CreditCardTermsRepository extends JpaRepository<CreditCardTerms, Long> {

    Optional<CreditCardTerms> findByAccountIdAndUserIdAndDeletedAtIsNull(Long accountId, Long userId);
}
