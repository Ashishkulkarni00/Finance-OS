package com.finance.importing;

import com.finance.importing.domain.ImportRow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImportRowRepository extends JpaRepository<ImportRow, Long> {

    List<ImportRow> findByImportBatchIdAndUserIdOrderByRowNumberAsc(Long importBatchId, Long userId);
}
