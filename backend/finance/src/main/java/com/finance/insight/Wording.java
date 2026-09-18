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

    public static String date(LocalDate date) {
        return date.format(DAY_MONTH);
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
