package com.finance.importing;

import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.importing.domain.ImportRow;
import com.finance.transaction.domain.TransactionType;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Reads a bank or card statement exported as CSV - the file people actually have, not a
 * format we invented (the older {@link ImportCsvParser} needs account and category ids).
 *
 * <p>Finds the header row itself (banks put a few lines of account details above it) by
 * looking for a date column plus either debit/credit columns or one amount column, then:
 * <ul>
 *   <li>a withdrawal / debit becomes an EXPENSE, a deposit / credit becomes INCOME - the
 *       review screen can change either to a transfer before anything is imported;</li>
 *   <li>on a credit card, a credit is usually the bill payment (already recorded as a
 *       transfer from the bank) - it's staged but left out, with that reason;</li>
 *   <li>lines without a readable date and amount (opening balance, totals, footers) are
 *       skipped; a line with an amount but an unreadable date is kept as an error, so
 *       nothing that looks like money disappears silently.</li>
 * </ul>
 * Pure - no repositories; categories and duplicates are handled by the service.
 */
@Component
public class BankStatementParser {

    private static final int MAX_DESCRIPTION = 200;
    private static final int MAX_RAW = 1000;

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            pattern("dd/MM/yy"), pattern("dd/MM/yyyy"), pattern("d/M/yyyy"), pattern("d/M/yy"),
            pattern("dd-MM-yyyy"), pattern("dd-MM-yy"), pattern("dd-MMM-yyyy"), pattern("dd-MMM-yy"),
            pattern("dd MMM yyyy"), pattern("d MMM yyyy"), pattern("dd.MM.yyyy"), pattern("yyyy-MM-dd"));

    private static DateTimeFormatter pattern(String p) {
        return new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern(p).toFormatter(Locale.ENGLISH);
    }

    /** Where each field is in the header; -1 when absent. */
    record Columns(int date, int description, int debit, int credit, int amount, int drCr) {
        boolean usable() {
            return date >= 0 && (debit >= 0 || credit >= 0 || amount >= 0);
        }
    }

    public List<ImportRow> parse(InputStream input, Long accountId, boolean creditCard) {
        List<String> lines = readLines(input);
        int headerIndex = -1;
        Columns columns = null;
        for (int i = 0; i < lines.size() && headerIndex < 0; i++) {
            Columns candidate = columnsOf(split(lines.get(i)));
            if (candidate.usable()) {
                headerIndex = i;
                columns = candidate;
            }
        }
        if (columns == null) {
            throw new BusinessRuleException(ErrorCode.IMPORT_ROW_INVALID,
                    "Couldn't find the statement's header row. Export it as CSV with a date column and "
                            + "withdrawal/deposit (or debit/credit, or amount) columns.", "file");
        }

        List<ImportRow> rows = new ArrayList<>();
        for (int i = headerIndex + 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.isBlank()) {
                continue;
            }
            ImportRow row = parseLine(split(line), line, i + 1, columns, accountId, creditCard);
            if (row != null) {
                rows.add(row);
            }
        }
        return rows;
    }

    private ImportRow parseLine(String[] cells, String raw, int rowNumber, Columns c, Long accountId, boolean creditCard) {
        BigDecimal debit = amountAt(cells, c.debit());
        BigDecimal credit = amountAt(cells, c.credit());
        BigDecimal single = amountAt(cells, c.amount());
        if (single != null && debit == null && credit == null) {
            String marker = c.drCr() >= 0 && c.drCr() < cells.length ? cells[c.drCr()].trim().toLowerCase(Locale.ROOT) : "";
            if (marker.startsWith("cr")) {
                credit = single.abs();
            } else if (marker.startsWith("dr") || single.signum() < 0) {
                debit = single.abs();
            } else if (creditCard) {
                // Card exports list spends as positive amounts and mark credits "Cr".
                debit = single.abs();
            } else {
                // A bank's single signed column: negative is money out, positive is money in.
                credit = single.abs();
            }
        }
        boolean hasMoney = (debit != null && debit.signum() > 0) || (credit != null && credit.signum() > 0);
        LocalDate date = dateAt(cells, c.date());
        if (!hasMoney) {
            return null; // opening balance, totals, footers
        }
        ImportRow.ImportRowBuilder row = ImportRow.builder()
                .rowNumber(rowNumber)
                .rawLine(raw.length() > MAX_RAW ? raw.substring(0, MAX_RAW) : raw)
                .accountId(accountId);
        if (date == null) {
            return row.parseError("Couldn't read the date in this line.").build();
        }
        String description = c.description() >= 0 && c.description() < cells.length ? cells[c.description()].trim() : "";
        if (description.isEmpty()) {
            description = "Statement entry";
        }
        row.date(date).description(description.length() > MAX_DESCRIPTION ? description.substring(0, MAX_DESCRIPTION) : description);

        boolean moneyIn = credit != null && credit.signum() > 0;
        if (moneyIn && creditCard) {
            return row.type(TransactionType.REFUND).amount(credit)
                    .parseError("A credit on the card - usually the bill payment, already recorded as a transfer from "
                            + "your bank. Left out; if it was a refund, add it in the Ledger.")
                    .build();
        }
        return moneyIn
                ? row.type(TransactionType.INCOME).amount(credit).build()
                : row.type(TransactionType.EXPENSE).amount(debit).build();
    }

    private Columns columnsOf(String[] header) {
        int date = -1, valueDate = -1, description = -1, debit = -1, credit = -1, amount = -1, drCr = -1;
        for (int i = 0; i < header.length; i++) {
            String h = header[i].trim().toLowerCase(Locale.ROOT);
            if (h.isEmpty()) {
                continue;
            }
            if (h.contains("value") && h.contains("date")) {
                valueDate = i;
            } else if (h.contains("date") && date < 0) {
                date = i;
            } else if (description < 0 && (h.contains("narration") || h.contains("description") || h.contains("particular")
                    || h.contains("details") || h.contains("remark") || h.equals("transaction"))) {
                description = i;
            } else if (debit < 0 && (h.contains("withdrawal") || h.contains("debit") || h.equals("dr") || h.contains("paid out"))) {
                debit = i;
            } else if (credit < 0 && (h.contains("deposit") || h.contains("credit") || h.equals("cr") || h.contains("paid in"))) {
                credit = i;
            } else if (drCr < 0 && (h.equals("dr/cr") || h.equals("cr/dr") || h.equals("type") || h.contains("debit/credit"))) {
                drCr = i;
            } else if (amount < 0 && h.contains("amount") && !h.contains("balance")) {
                amount = i;
            }
        }
        return new Columns(date >= 0 ? date : valueDate, description, debit, credit, amount, drCr);
    }

    private LocalDate dateAt(String[] cells, int index) {
        if (index < 0 || index >= cells.length) {
            return null;
        }
        String text = cells[index].trim();
        // "05/10/26 10:42" - keep the date part.
        int space = text.indexOf(' ');
        String first = space > 0 && text.substring(0, space).matches(".*\\d.*[/-].*\\d.*") ? text.substring(0, space) : text;
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(first, f);
            } catch (DateTimeParseException ignored) {
                // try the next format
            }
        }
        return null;
    }

    private BigDecimal amountAt(String[] cells, int index) {
        if (index < 0 || index >= cells.length) {
            return null;
        }
        String text = cells[index].trim()
                .replace(",", "").replace("₹", "").replace("INR", "").replace("Rs.", "").replace(" ", "");
        boolean negative = text.startsWith("(") && text.endsWith(")");
        text = text.replace("(", "").replace(")", "");
        if (text.isEmpty() || text.equals("-")) {
            return null;
        }
        try {
            BigDecimal value = new BigDecimal(text).setScale(2, java.math.RoundingMode.HALF_UP);
            return negative ? value.negate() : value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<String> readLines(InputStream input) {
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // Strip a UTF-8 byte-order mark some banks add.
                lines.add(lines.isEmpty() && line.startsWith("﻿") ? line.substring(1) : line);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded file", e);
        }
        return lines;
    }

    /** CSV split that respects double-quoted cells (with "" as an escaped quote). */
    private static String[] split(String line) {
        List<String> cells = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (ch == ',' && !quoted) {
                cells.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        cells.add(current.toString());
        return cells.toArray(new String[0]);
    }
}
