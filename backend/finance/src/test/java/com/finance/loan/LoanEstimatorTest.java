package com.finance.loan;

import com.finance.loan.dto.LoanEstimateRequest;
import com.finance.loan.dto.LoanEstimateResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class LoanEstimatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 14);

    private final LoanEstimator estimator = new LoanEstimator(
            new AmortisationCalculator(),
            Clock.fixed(TODAY.atStartOfDay().toInstant(ZoneOffset.UTC), ZoneOffset.UTC));

    private static LoanEstimateRequest terms(String principal, String rate, Integer tenure, LocalDate disbursed, String emi) {
        return new LoanEstimateRequest(
                principal == null ? null : new BigDecimal(principal),
                rate == null ? null : new BigDecimal(rate),
                tenure, disbursed, null,
                emi == null ? null : new BigDecimal(emi),
                null, null, null, null);
    }

    @Test
    void fromOriginalTerms_worksOutWhereTheLoanStandsToday() {
        LoanEstimateResponse r = estimator.estimate(terms("214886", "16.5", 48, LocalDate.of(2025, 10, 5), null));

        // No EMI in the month of disbursal: first one a month later.
        assertThat(r.originalFirstEmiDate()).isEqualTo(LocalDate.of(2025, 11, 5));
        // 6145.10 to the paise; lenders quote the rupee.
        assertThat(r.standardEmi()).isEqualByComparingTo("6145");
        // Nov 2025 .. Sep 2026 have gone out.
        assertThat(r.emisPaid()).isEqualTo(11);
        assertThat(r.emisRemaining()).isEqualTo(37);
        assertThat(r.nextEmiDate()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(r.lastEmiDate()).isEqualTo(LocalDate.of(2029, 10, 5));
        assertThat(r.outstandingBalance()).isBetween(new BigDecimal("177000"), new BigDecimal("177600"));
    }

    @Test
    void anEmiThatDoesNotFitTheTermsIsFlagged() {
        LoanEstimateResponse off = estimator.estimate(terms("129000", "9.35", 60, LocalDate.of(2023, 10, 5), "3417"));
        LoanEstimateResponse bankRounded = estimator.estimate(terms("214886", "16.5", 48, LocalDate.of(2025, 10, 5), "6145"));

        assertThat(off.standardEmi()).isEqualByComparingTo("2700");
        assertThat(off.emiDiffersFromTerms()).isTrue();
        assertThat(bankRounded.emiDiffersFromTerms()).isFalse();
    }

    @Test
    void fromTodaysFigures_emisLeftFollowFromOutstandingRateAndEmi() {
        LoanEstimateResponse r = estimator.estimate(new LoanEstimateRequest(
                null, new BigDecimal("12"), null, null, null, new BigDecimal("4708"),
                new BigDecimal("100000"), null, 5, LocalDate.of(2026, 6, 14)));

        assertThat(r.emisRemaining()).isEqualTo(24);
        assertThat(r.nextEmiDate()).isEqualTo(LocalDate.of(2026, 7, 5));
        assertThat(r.lastEmiDate()).isEqualTo(LocalDate.of(2028, 6, 5));
    }

    @Test
    void fromTodaysFigures_emiFollowsFromOutstandingRateAndEmisLeft() {
        LoanEstimateResponse r = estimator.estimate(new LoanEstimateRequest(
                null, new BigDecimal("12"), null, null, null, null,
                new BigDecimal("100000"), 24, null, null));

        assertThat(r.emi()).isEqualByComparingTo("4707");
        assertThat(r.nextEmiDate()).isNull();
    }

    @Test
    void zeroRateLoanSplitsEvenly_andNothingIsGuessedWithoutEnoughToGoOn() {
        assertThat(estimator.estimate(terms("12000", "0", 12, null, null)).standardEmi()).isEqualByComparingTo("1000");

        LoanEstimateResponse bare = estimator.estimate(terms("12000", null, null, null, null));
        assertThat(bare.standardEmi()).isNull();
        assertThat(bare.emisRemaining()).isNull();
        assertThat(bare.outstandingBalance()).isNull();
    }
}
