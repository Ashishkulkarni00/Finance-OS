package com.finance.insight.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InsightStateRepository extends JpaRepository<InsightState, Long> {

    /** Everything currently true for this user - the left-hand side of the diff on a write. */
    List<InsightState> findByUserIdAndClearedAtIsNull(Long userId);

    /** One warning's history, newest first: how often it recurs and how long it lasts. */
    List<InsightState> findByUserIdAndInsightKeyOrderByFirstSeenAtDesc(Long userId, String insightKey);
}
