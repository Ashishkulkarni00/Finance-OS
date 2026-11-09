package com.finance.reservation;

import com.finance.account.domain.Account;
import com.finance.goal.GoalRepository;
import com.finance.goal.domain.Goal;
import com.finance.reservation.domain.Reservation;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Money still set aside for a goal that has been archived, or that no longer exists.
 *
 * <p><strong>Why.</strong> The user archived *Bangalore trip tickets booking* on 18 Oct, past
 * a target date of 31 Oct. Its ₹3,226 reservation on HDFC Salary stayed live and kept
 * reducing Real Balance for two weeks — ₹3,226 out of ₹6,876, so the day rate read ₹135
 * instead of ₹255. They found it by asking why the Add transaction form said money was held
 * back, not because anything in the product mentioned it (FIX_BACKLOG 1.19).
 *
 * <p><strong>Why an insight and not an automatic release.</strong> Money set aside is the
 * user's own statement of intent. Undoing it on their behalf because a *different* record was
 * archived is a silent plan rewrite, which is the thing ADR-0015 exists to prevent — and
 * archiving a goal is not the same act as deciding the money is free. Prompting at the moment
 * of archiving would be better UX and is worth building later, but it does nothing for money
 * already stranded, which is the case that actually happened.
 *
 * <p><strong>Archived and gone are different sentences.</strong> An archived goal can be
 * named and dated, so the reader can judge it. A goal that has been deleted leaves a
 * reservation pointing at nothing, and the only honest thing to say is that nothing explains
 * what the money is for any more.
 *
 * <p>Two queries, both already filtered by user: every live reservation, and every goal
 * including archived ones. Nothing is stored.
 */
@Component
public class StrandedReservationCalculator {

    private final ReservationRepository reservations;
    private final GoalRepository goals;
    private final ZoneId zone;

    public StrandedReservationCalculator(ReservationRepository reservations, GoalRepository goals,
                                         java.time.Clock clock) {
        this.reservations = reservations;
        this.goals = goals;
        this.zone = clock.getZone();
    }

    /**
     * One entry per reservation whose goal is over. Reservations with no goal are absent:
     * money set aside for "rent I'm holding for a flatmate" answers for itself and has no
     * goal to outlive.
     *
     * @param accounts already loaded by the caller, for naming the account in the sentence
     */
    public List<StrandedReservation> forUser(Long userId, List<Account> accounts) {
        List<Reservation> live = reservations.findByUserIdAndDeletedAtIsNull(userId);
        if (live.isEmpty()) {
            return List.of();
        }

        // Archived included on purpose - an archived goal is precisely what this looks for.
        // Deleted goals are still excluded by the query, and their absence is the signal for
        // GOAL_GONE rather than a lookup failure to paper over.
        Map<Long, Goal> byId = new HashMap<>();
        for (Goal goal : goals.findAllForUser(userId, true, Pageable.unpaged())) {
            byId.put(goal.getId(), goal);
        }
        Map<Long, String> accountNames = new HashMap<>();
        for (Account account : accounts) {
            accountNames.put(account.getId(), account.getName());
        }

        List<StrandedReservation> out = new ArrayList<>();
        for (Reservation reservation : live) {
            Long goalId = reservation.getGoalId();
            if (goalId == null) {
                continue;
            }
            Goal goal = byId.get(goalId);
            if (goal != null && !goal.isArchived()) {
                continue;
            }
            boolean archived = goal != null;
            out.add(new StrandedReservation(
                    reservation.getId(),
                    reservation.getPurpose(),
                    reservation.getAmount(),
                    reservation.getAccountId(),
                    accountNames.getOrDefault(reservation.getAccountId(), "an account"),
                    goalId,
                    archived ? goal.getName() : null,
                    archived ? StrandedReservation.Reason.GOAL_ARCHIVED : StrandedReservation.Reason.GOAL_GONE,
                    archived ? LocalDate.ofInstant(goal.getArchivedAt(), zone) : null));
        }
        return out;
    }
}
