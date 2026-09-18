package com.finance.investment;

import com.finance.investment.domain.Investment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Data access for investments. Every query filters by {@code userId}. */
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    Optional<Investment> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    Page<Investment> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    List<Investment> findByUserIdAndDeletedAtIsNull(Long userId);
}
