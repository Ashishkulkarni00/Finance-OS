package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.cycle.domain.Cycle;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Whether a commitment rule produces an occurrence in a cycle, and on what date.
 *
 * <p>The cycle throughout is 28 Aug – 27 Sep 2026, the salary-to-salary shape the product
 * is built around, and every due day below is "the 2nd" - the day that falls on the far
 * side of the month boundary from the cycle's start, which is where the date pivot and
 * the active-window check interact.
 */
class CommitmentInstanceGeneratorTest {

    private final CommitmentInstanceGenerator generator = new CommitmentInstanceGenerator();

    private static final Cycle CYCLE = Cycle.builder()
            .id(1L)
            .userId(1L)
            .startDate(LocalDate.of(2026, 8, 28))
            .endDate(LocalDate.of(2026, 9, 27))
            .build();

    private static Commitment monthlyOnThe2nd(LocalDate activeFrom, LocalDate activeTo) {
        return Commitment.builder()
                .id(1L)
                .userId(1L)
                .name("Electricity")
                .amountType(CommitmentAmountType.VARIABLE)
                .frequency(CommitmentFrequency.MONTHLY)
                .dueDay(2)
                .accountId(1L)
                .activeFrom(activeFrom)
                .activeTo(activeTo)
                .build();
    }

    @Test
    @DisplayName("a bill added after this cycle's due date is not charged for a date before it existed")
    void addedAfterDueDateDoesNotOccur() {
        // The real case: added 12 Sep, due on the 2nd. Active during the cycle, but its
        // 2 Sep occurrence predates it - the first real one is 2 Oct, next cycle.
        Commitment electricity = monthlyOnThe2nd(LocalDate.of(2026, 9, 12), null);

        assertThat(generator.occursIn(electricity, CYCLE)).isFalse();
    }

    @Test
    @DisplayName("a bill added before this cycle's due date does occur, on that date")
    void addedBeforeDueDateOccurs() {
        Commitment electricity = monthlyOnThe2nd(LocalDate.of(2026, 9, 1), null);

        assertThat(generator.occursIn(electricity, CYCLE)).isTrue();
        assertThat(generator.generate(electricity, CYCLE).getDueDate()).isEqualTo(LocalDate.of(2026, 9, 2));
    }

    @Test
    @DisplayName("a bill added on its due date occurs - the start is inclusive")
    void addedOnDueDateOccurs() {
        Commitment electricity = monthlyOnThe2nd(LocalDate.of(2026, 9, 2), null);

        assertThat(generator.occursIn(electricity, CYCLE)).isTrue();
    }

    @Test
    @DisplayName("a bill that ended before this cycle's due date owes nothing in it")
    void endedBeforeDueDateDoesNotOccur() {
        Commitment electricity = monthlyOnThe2nd(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 9, 1));

        assertThat(generator.occursIn(electricity, CYCLE)).isFalse();
    }

    @Test
    @DisplayName("a long-running monthly bill occurs, dated on the far side of the month boundary")
    void ongoingBillOccursWithPivotedDueDate() {
        Commitment electricity = monthlyOnThe2nd(LocalDate.of(2026, 1, 1), null);

        assertThat(generator.occursIn(electricity, CYCLE)).isTrue();
        CommitmentInstance instance = generator.generate(electricity, CYCLE);
        // Due day 2 is before the cycle's start day 28, so it lands in September, not August.
        assertThat(instance.getDueDate()).isEqualTo(LocalDate.of(2026, 9, 2));
        // A variable bill has no amount until one is given - never a guessed zero.
        assertThat(instance.getExpectedAmount()).isNull();
    }
}
