package com.finance.plan;

import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.cycle.domain.Cycle;
import com.finance.plan.domain.PlanFieldChange;
import com.finance.plan.domain.PlanRevision;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Writes a {@link PlanRevision} for a change a domain service is making. The single door
 * through which the plan's history is recorded - see ADR-0015.
 *
 * <p>Joins the caller's transaction ({@code MANDATORY}): the revision and the change it
 * describes are one fact, and a plan edit that succeeded while its record failed would be
 * exactly the silent rewrite this exists to prevent.
 *
 * <p>Depends on {@link CurrentCycleResolver} rather than {@code CycleService}, for the
 * reason set out on that class - a path back through {@code CycleService} would be a
 * circular bean dependency. It resolves <em>existing only</em>: recording history must
 * never bring a cycle into being as a side effect, so {@code cycleId} is left null when
 * no cycle covers the day.
 */
@Component
public class PlanRevisionRecorder {

    private static final Logger log = LoggerFactory.getLogger(PlanRevisionRecorder.class);

    private final PlanRevisionRepository repository;
    private final CurrentUserProvider currentUser;
    private final CurrentCycleResolver cycleResolver;
    private final Clock clock;

    public PlanRevisionRecorder(PlanRevisionRepository repository,
                                CurrentUserProvider currentUser,
                                CurrentCycleResolver cycleResolver,
                                Clock clock) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.cycleResolver = cycleResolver;
        this.clock = clock;
    }

    /**
     * Records the draft, unless it describes nothing that moved. Returns the saved
     * revision, or null when there was nothing worth recording - callers ignore it; it is
     * returned for the write paths that will want to report the effect back to the user
     * (ROADMAP 0.4).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public PlanRevision record(PlanChangeDraft draft) {
        if (!draft.isWorthRecording()) {
            return null;
        }
        Long userId = currentUser.currentUserId();
        LocalDate today = LocalDate.now(clock);
        Long cycleId = cycleResolver.resolveExistingOnly(userId, today).map(Cycle::getId).orElse(null);

        PlanRevision revision = PlanRevision.builder()
                .userId(userId)
                .subjectType(draft.subjectType())
                .subjectId(draft.subjectId())
                .subjectName(draft.subjectName())
                .revisionType(draft.revisionType())
                .supersededSubjectId(draft.supersededSubjectId())
                .decidedAt(Instant.now(clock))
                .effectiveFrom(draft.effectiveFromOr(today))
                .cycleId(cycleId)
                .reason(draft.reason())
                .monthlyEffect(draft.monthlyEffectValue())
                .createdAt(Instant.now(clock))
                .build();

        for (PlanChangeDraft.Line line : draft.lines()) {
            revision.addChange(PlanFieldChange.builder()
                    .field(line.field())
                    .label(line.label())
                    .valueKind(line.kind())
                    .oldValue(line.oldValue())
                    .newValue(line.newValue())
                    .build());
        }

        PlanRevision saved = repository.save(revision);
        // No amounts and no names: the log line says what kind of change, not what it was
        // worth or what it was called (ADR-0010).
        log.info("Plan revision recorded id={} subjectType={} subjectId={} type={} fields={}",
                saved.getId(), draft.subjectType(), draft.subjectId(), draft.revisionType(), draft.lines().size());
        return saved;
    }
}
