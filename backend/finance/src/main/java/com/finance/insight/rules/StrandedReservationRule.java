package com.finance.insight.rules;

import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import com.finance.reservation.StrandedReservation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;

/**
 * Money still set aside for a goal that is over.
 *
 * <p>The reservation keeps doing its job - holding the money out of Real Balance - long
 * after the thing it was held for has gone. On this user's data ₹3,226 sat reserved for a
 * trip whose goal had been archived two weeks earlier, and the day rate read ₹135 when it
 * should have read ₹255 (FIX_BACKLOG 1.19).
 *
 * <p><strong>It says what the money is doing, not what to do with it.</strong> Releasing a
 * reservation is the user's call: they may well still be saving for the trip and have simply
 * tidied the goal away. So the sentence states the effect — this much is being kept out of
 * what you can spend — and the action opens the account where Release lives, rather than
 * offering to undo it from a warning. A product that quietly releases money because a
 * different record was archived is doing a plan rewrite nobody asked for (ADR-0015).
 *
 * <p><strong>ATTENTION, and ranked by size.</strong> Nothing is lost if it is ignored, and
 * nothing happens on a particular day, so there is no date to give - but the bigger the
 * amount, the more the day rate is understating what is actually available.
 */
@Component
public class StrandedReservationRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (StrandedReservation stranded : ctx.strandedReservations()) {
            boolean archived = stranded.reason() == StrandedReservation.Reason.GOAL_ARCHIVED;

            String title = archived
                    ? money(stranded.amount()) + " is still set aside for " + stranded.goalName()
                    : money(stranded.amount()) + " is set aside for a goal that no longer exists";

            StringBuilder why = new StringBuilder();
            if (archived) {
                why.append("You archived that goal");
                if (stranded.since() != null) {
                    why.append(" on ").append(date(stranded.since(), ctx.today()));
                }
                why.append(", but the money is still held in ").append(stranded.accountName()).append(". ");
            } else {
                why.append("The goal it was held for has been deleted, so nothing now says what this money in ")
                        .append(stranded.accountName()).append(" is for. ");
            }
            why.append("Set-aside money doesn't count as yours to spend, so it is coming off what's free ")
                    .append("until salary and off the daily figure. Release it and it counts again — it ")
                    .append("stays in the account either way.");
            if (stranded.purpose() != null && !stranded.purpose().isBlank()) {
                why.append(" It's labelled \"").append(stranded.purpose()).append("\".");
            }

            out.add(new Insight(
                    "reservation:" + stranded.reservationId() + ":stranded",
                    InsightType.RESERVATION_STRANDED,
                    Severity.ATTENTION,
                    title,
                    why.toString(),
                    stranded.amount(),
                    // Undated: the archive date is when it started, not a day anything is due.
                    // Putting a past date here would rank it above every bill still to come.
                    null,
                    InsightAction.open("Open account", "/accounts/" + stranded.accountId()),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
