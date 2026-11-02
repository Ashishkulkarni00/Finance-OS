package com.finance.review;

import java.time.LocalDate;
import java.util.List;

/**
 * The consolidated run of salary months behind Summary.
 *
 * @param months          oldest first, so a chart can render them left to right without
 *                        reversing a list the server already ordered
 * @param monthsRecorded  how many of them have anything in them. The screen says this out
 *                        loud: two bars is a start, not a trend, and a chart that does not
 *                        admit how little it is drawn from invites exactly the conclusions
 *                        it cannot support
 * @param samePoint       this month against the last at the same point in the month, or null
 */
public record ReviewResult(
        LocalDate asOf,
        List<MonthReview> months,
        int monthsRecorded,
        SamePointComparison samePoint
) {
}
