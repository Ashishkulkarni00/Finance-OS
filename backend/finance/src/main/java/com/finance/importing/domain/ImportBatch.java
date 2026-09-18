package com.finance.importing.domain;

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

import java.time.Instant;

/**
 * One upload, staged for review before anything enters the ledger. Package named
 * {@code importing} rather than {@code import} - the latter is a Java keyword.
 *
 * <p>Scope for milestone 11, deliberately: CSV only (not XLSX - avoids adding Apache
 * POI as a dependency for one milestone), a fixed column order (no "remembered column
 * mapping" - that is a frontend preference feature, not backend logic), and no
 * category-learning heuristics (`PRODUCT_SCOPE.md`'s general caution against premature
 * intelligence features applies here too). Duplicate detection and staged review - the
 * two correctness-critical parts (A4: "duplicates detected before commit") - are real.
 */
@Entity
@Table(name = "import_batches")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ImportStatus status = ImportStatus.STAGED;

    @Column(name = "total_rows", nullable = false)
    private int totalRows;

    @Column(name = "duplicate_rows", nullable = false)
    private int duplicateRows;

    @Column(name = "invalid_rows", nullable = false)
    private int invalidRows;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @Column(name = "committed_at")
    private Instant committedAt;

    public boolean isCommitted() {
        return status == ImportStatus.COMMITTED;
    }
}
