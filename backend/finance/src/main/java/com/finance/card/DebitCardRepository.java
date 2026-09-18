package com.finance.card;

import com.finance.card.domain.DebitCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DebitCardRepository extends JpaRepository<DebitCard, Long> {

    Optional<DebitCard> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    List<DebitCard> findByUserIdAndDeletedAtIsNullOrderByNameAsc(Long userId);
}
