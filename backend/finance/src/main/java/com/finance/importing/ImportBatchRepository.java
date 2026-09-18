package com.finance.importing;

import com.finance.importing.domain.ImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImportBatchRepository extends JpaRepository<ImportBatch, Long> {

    Optional<ImportBatch> findByIdAndUserId(Long id, Long userId);
}
