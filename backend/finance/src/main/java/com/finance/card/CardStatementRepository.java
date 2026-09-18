package com.finance.card;

import com.finance.card.domain.CardStatement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** Withdrawn statements are excluded from every query by {@code CardStatement}'s restriction. */
public interface CardStatementRepository extends JpaRepository<CardStatement, Long> {

    List<CardStatement> findByAccountIdAndUserIdOrderByStatementDateDesc(Long accountId, Long userId);

    List<CardStatement> findByUserIdAndDueDateBetween(Long userId, LocalDate from, LocalDate to);

    Optional<CardStatement> findByIdAndAccountIdAndUserId(Long id, Long accountId, Long userId);

    boolean existsByAccountIdAndUserIdAndStatementDate(Long accountId, Long userId, LocalDate statementDate);

    @Query("""
            select s from CardStatement s
            where s.accountId = :accountId and s.userId = :userId
            order by s.statementDate desc limit 1
            """)
    Optional<CardStatement> findLatest(@Param("accountId") Long accountId, @Param("userId") Long userId);
}
