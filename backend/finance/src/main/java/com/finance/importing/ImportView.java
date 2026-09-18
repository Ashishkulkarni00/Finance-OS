package com.finance.importing;

import com.finance.importing.domain.ImportBatch;
import com.finance.importing.domain.ImportRow;

import java.util.List;

public record ImportView(ImportBatch batch, List<ImportRow> rows) {
}
