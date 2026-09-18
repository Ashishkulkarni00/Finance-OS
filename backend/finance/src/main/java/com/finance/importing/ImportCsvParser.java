package com.finance.importing;

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
import java.util.ArrayList;
import java.util.List;

/**
 * Parses a fixed-column-order CSV into staged {@link ImportRow}s. One malformed line
 * becomes one row with a {@code parseError} rather than failing the whole upload -
 * "staged review; nothing enters the ledger unreviewed" means bad rows are flagged,
 * not silently dropped and not fatal to the rest of the file.
 *
 * <p>Column order: {@code date,description,type,amount,accountId,toAccountId,categoryId,merchant,note}.
 * {@code toAccountId}, {@code categoryId}, {@code merchant}, {@code note} may be empty.
 * No header-name mapping - the header row (if present) is skipped by position, not read.
 */
@Component
public class ImportCsvParser {

    private static final int EXPECTED_COLUMNS = 9;

    public List<ImportRow> parse(InputStream input) {
        List<ImportRow> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            int rowNumber = 0;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (line.isBlank()) {
                    continue;
                }
                if (first) {
                    first = false;
                    if (looksLikeHeader(line)) {
                        continue;
                    }
                }
                rows.add(parseLine(line, rowNumber));
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded file", e);
        }
        return rows;
    }

    private boolean looksLikeHeader(String line) {
        String firstField = splitCsvLine(line)[0].trim().toLowerCase();
        return firstField.equals("date");
    }

    private ImportRow parseLine(String line, int rowNumber) {
        String[] fields = splitCsvLine(line);
        ImportRow.ImportRowBuilder row = ImportRow.builder().rowNumber(rowNumber).rawLine(line);

        if (fields.length < EXPECTED_COLUMNS) {
            return row.parseError("Expected " + EXPECTED_COLUMNS + " columns, found " + fields.length).build();
        }

        try {
            row.date(LocalDate.parse(fields[0].trim()));
        } catch (Exception e) {
            return row.parseError("Column 1 (date): \"" + fields[0] + "\" isn't a valid date (use YYYY-MM-DD)").build();
        }

        row.description(fields[1].trim());

        try {
            row.type(TransactionType.valueOf(fields[2].trim().toUpperCase()));
        } catch (Exception e) {
            return row.parseError("Column 3 (type): \"" + fields[2] + "\" isn't a valid transaction type").build();
        }

        try {
            row.amount(new BigDecimal(fields[3].trim()));
        } catch (Exception e) {
            return row.parseError("Column 4 (amount): \"" + fields[3] + "\" isn't a valid amount").build();
        }

        try {
            row.accountId(Long.parseLong(fields[4].trim()));
        } catch (Exception e) {
            return row.parseError("Column 5 (accountId): \"" + fields[4] + "\" isn't a valid account id").build();
        }

        row.toAccountId(parseOptionalLong(fields[5]));
        row.categoryId(parseOptionalLong(fields[6]));
        row.merchant(blankToNull(fields[7]));
        row.note(blankToNull(fields[8]));

        return row.build();
    }

    private Long parseOptionalLong(String field) {
        String trimmed = field.trim();
        return trimmed.isEmpty() ? null : Long.parseLong(trimmed);
    }

    private String blankToNull(String field) {
        String trimmed = field.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Minimal CSV split - handles double-quoted fields containing commas, not escaped quotes within. */
    private String[] splitCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }
}
