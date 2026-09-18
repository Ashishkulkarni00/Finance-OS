package com.finance.importing.domain;

import com.finance.transaction.domain.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One parsed row from an upload - staged, not yet a {@code Transaction}. A row with a
 * {@code parseError} can never be committed. A {@code duplicate} row is committed only
 * if the caller explicitly includes it - see {@code ImportServiceImpl.commit}.
 */
@Entity
@Table(name = "import_rows")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "import_batch_id", nullable = false, updatable = false)
    private Long importBatchId;

    /** DB column is `row_index`, not `row_number` - the latter is a reserved word in MySQL 8 (a window function). */
    @Column(name = "row_index", nullable = false, updatable = false)
    private int rowNumber;

    @Column(name = "raw_line", length = 1000)
    private String rawLine;

    @Column(name = "transaction_date")
    private LocalDate date;

    @Column(name = "description", length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private TransactionType type;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "to_account_id")
    private Long toAccountId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "merchant", length = 100)
    private String merchant;

    @Column(name = "note", length = 500)
    private String note;

    /** Set when the raw line couldn't be parsed into a well-formed row - never committable. */
    @Column(name = "parse_error", length = 500)
    private String parseError;

    @Column(name = "duplicate", nullable = false)
    @Builder.Default
    private boolean duplicate = false;

    /** The existing transaction this row appears to duplicate, if any. */
    @Column(name = "duplicate_of_transaction_id")
    private Long duplicateOfTransactionId;

    /** Set once this row has actually been committed into the ledger. */
    @Column(name = "committed_transaction_id")
    private Long committedTransactionId;

    public boolean isValid() {
        return parseError == null;
    }
}
