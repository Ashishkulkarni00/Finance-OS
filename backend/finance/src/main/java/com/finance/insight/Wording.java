package com.finance.insight;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/**
 * The engine's voice: rupees in Indian grouping without paise ("₹1,23,450"), dates as
 * "5 Oct", relative days as "today" / "tomorrow" / "in 3 days" / "2 days ago". Facts and
 * consequences only - never a verdict (CLAUDE.md rule 8).
 */
public final class Wording {

    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter DAY_MONTH_YEAR = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private Wording() {
    }

    public static String money(BigDecimal amount) {
        if (amount == null) {
            return "—";
        }
        BigDecimal rounded = amount.abs().setScale(0, RoundingMode.HALF_UP);
        String digits = rounded.toPlainString();
        StringBuilder out = new StringBuilder();
        int n = digits.length();
        if (n <= 3) {
            out.append(digits);
        } else {
            String head = digits.substring(0, n - 3);
            String tail = digits.substring(n - 3);
            StringBuilder grouped = new StringBuilder();
            for (int i = head.length(); i > 0; i -= 2) {
                grouped.insert(0, head.substring(Math.max(0, i - 2), i));
                if (i - 2 > 0) {
                    grouped.insert(0, ',');
                }
            }
            out.append(grouped).append(',').append(tail);
        }
        return (amount.signum() < 0 ? "−₹" : "₹") + out;
    }

    /**
     * "5 Oct". Day and month only, for a date inside the next few weeks - a card bill, a
     * missed plan item - where the year is never in doubt.
     *
     * <p>Use {@link #date(LocalDate, LocalDate)} for anything that can fall in another year.
     * A goal dated 31 August 2027 rendered as "31 Aug" reads as this August, which is the
     * kind of quietly wrong that a person acts on.
     */
    public static String date(LocalDate date) {
        return date.format(DAY_MONTH);
    }

    /** "5 Oct", or "31 Aug 2027" once the year stops being obvious. */
    public static String date(LocalDate date, LocalDate today) {
        return date.getYear() == today.getYear() ? date.format(DAY_MONTH) : date.format(DAY_MONTH_YEAR);
    }

    /** "today", "tomorrow", "in 3 days", "yesterday", "4 days ago". */
    public static String relative(LocalDate date, LocalDate today) {
        long days = ChronoUnit.DAYS.between(today, date);
        if (days == 0) return "today";
        if (days == 1) return "tomorrow";
        if (days == -1) return "yesterday";
        return days > 0 ? "in " + days + " days" : (-days) + " days ago";
    }
}
