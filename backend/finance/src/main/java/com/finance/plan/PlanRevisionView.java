package com.finance.plan;

import com.finance.plan.domain.PlanFieldChange;
import com.finance.plan.domain.PlanRevision;

import java.util.List;

/**
 * A revision with its field lines already read.
 *
 * <p>{@code spring.jpa.open-in-view=false}, so the lazy {@code changes} collection has to
 * be materialised inside the service's transaction rather than left for the mapper to
 * trip over.
 */
public record PlanRevisionView(PlanRevision revision, List<PlanFieldChange> changes) {

    static PlanRevisionView of(PlanRevision revision) {
        return new PlanRevisionView(revision, List.copyOf(revision.getChanges()));
    }
}
