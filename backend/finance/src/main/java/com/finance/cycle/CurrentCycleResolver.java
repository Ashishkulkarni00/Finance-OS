package com.finance.cycle;

import com.finance.cycle.domain.Cycle;
import com.finance.user.UserRepository;
import com.finance.user.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Finds or lazily creates the cycle containing a given date, for callers that must
 * not depend on {@code CycleService} itself.
 *
 * <p>{@code PositionServiceImpl}, {@code CommitmentAutoMatcher} and
 * {@code ProjectionServiceImpl} all need "the cycle containing date X", but none of
 * them may depend on {@code CycleService} - {@code CycleServiceImpl.close} already
 * calls {@code PositionService}, so a path back through {@code CycleService} from any
 * of these would be a circular bean dependency. This component holds the one lazy
 * find-or-create implementation directly against {@code CycleRepository}/
 * {@code CycleCalculator}/{@code UserRepository}, so it exists exactly once rather
 * than being copied at each call site. See the equivalent note on
 * {@code AccountBalanceCalculator}.
 */
@Component
public class CurrentCycleResolver {

    private static final Logger log = LoggerFactory.getLogger(CurrentCycleResolver.class);

    private final CycleRepository cycleRepository;
    private final CycleCalculator cycleCalculator;
    private final UserRepository userRepository;

    public CurrentCycleResolver(CycleRepository cycleRepository,
                                CycleCalculator cycleCalculator,
                                UserRepository userRepository) {
        this.cycleRepository = cycleRepository;
        this.cycleCalculator = cycleCalculator;
        this.userRepository = userRepository;
    }

    public Cycle resolve(Long userId, LocalDate date) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId).orElseThrow();
        CycleBoundary boundary = cycleCalculator.boundaryContaining(date, user.getCycleStartDay());

        return cycleRepository.findByUserIdAndStartDate(userId, boundary.startDate())
                .orElseGet(() -> {
                    Cycle saved = cycleRepository.save(Cycle.builder()
                            .userId(userId)
                            .startDate(boundary.startDate())
                            .endDate(boundary.endDate())
                            .createdAt(Instant.now())
                            .build());
                    log.info("Cycle created id={} start={}", saved.getId(), saved.getStartDate());
                    return saved;
                });
    }

    /** Same lookup, but returns empty rather than creating - for callers that must not materialise a cycle. */
    public java.util.Optional<Cycle> resolveExistingOnly(Long userId, LocalDate date) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId).orElseThrow();
        CycleBoundary boundary = cycleCalculator.boundaryContaining(date, user.getCycleStartDay());
        return cycleRepository.findByUserIdAndStartDate(userId, boundary.startDate());
    }
}
