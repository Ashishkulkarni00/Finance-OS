package com.finance.plan;

import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.plan.domain.PlanRevision;
import com.finance.plan.domain.PlanSubjectType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PlanRevisionServiceImpl implements PlanRevisionService {

    private final PlanRevisionRepository repository;
    private final CurrentUserProvider currentUser;

    public PlanRevisionServiceImpl(PlanRevisionRepository repository, CurrentUserProvider currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlanRevisionView> list(Pageable pageable) {
        return repository.findAllForUser(currentUser.currentUserId(), pageable).map(PlanRevisionView::of);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlanRevisionView> forSubject(PlanSubjectType subjectType, Long subjectId, Pageable pageable) {
        return repository.findForSubject(currentUser.currentUserId(), subjectType, subjectId, pageable)
                .map(PlanRevisionView::of);
    }

    @Override
    @Transactional(readOnly = true)
    public CyclePlanChanges forCycle(Long cycleId) {
        List<PlanRevision> revisions = repository.findForCycle(currentUser.currentUserId(), cycleId);

        int decisions = 0;
        int followedSources = 0;
        BigDecimal net = BigDecimal.ZERO;
        boolean complete = true;

        for (PlanRevision revision : revisions) {
            if (revision.getRevisionType().isUserDecision()) {
                decisions++;
            } else {
                followedSources++;
            }
            // Every revision counts toward the cash effect, including the ones that merely
            // followed a loan - the money moves either way. What "decided" versus "followed"
            // separates is responsibility, not arithmetic.
            if (revision.getMonthlyEffect() == null) {
                complete = false;
            } else {
                net = net.add(revision.getMonthlyEffect());
            }
        }

        return new CyclePlanChanges(
                cycleId,
                revisions.stream().map(PlanRevisionView::of).toList(),
                decisions,
                followedSources,
                complete ? MoneyScale.normalise(net) : null,
                complete);
    }
}
