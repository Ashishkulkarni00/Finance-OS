package com.finance.state.dto;

import com.finance.commitment.dto.CycleShapeResponse;
import com.finance.common.money.MoneySerializer;
import com.finance.position.dto.NetWorthResponse;
import com.finance.position.dto.PositionResponse;
import com.finance.state.Provenance;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code GET /financial-state}: the whole position in one object (ROADMAP 2.1).
 *
 * <p>Composed from the responses each area already returns — {@code PositionResponse},
 * {@code CycleShapeResponse}, {@code NetWorthResponse} — rather than a flattened copy of
 * them. Re-listing those figures here would give the API two shapes for the same money, and
 * a screen reading this could then disagree with the screen reading the original.
 *
 * <p>Null means <strong>unknown</strong> throughout, never zero (ADR-0006).
 *
 * @param complete false when a mandatory bill still has no amount; the figures that depend
 *                 on it are null rather than estimated
 */
public record FinancialStateResponse(
        LocalDate asOf,
        CycleRef cycle,
        int daysToSalary,
        boolean complete,

        PositionResponse position,
        CycleShapeResponse shape,
        NetWorthResponse netWorth,

        RunwayResponse runway,
        BaselineResponse baseline,
        DebtResponse debt,

        /** How many things need the user right now — the same engine as Needs you. */
        int attentionCount
) {

    public record CycleRef(Long id, LocalDate startDate, LocalDate endDate, String label) {
    }

    /**
     * Why a figure is what it is (ROADMAP 2.3).
     *
     * <p>{@code excluded} lines are inputs the figure could <strong>not</strong> use — a bill
     * with no amount, a holding that is locked away. They are carried rather than dropped
     * because they are usually the most important part of the answer: they are the reason the
     * figure is a ceiling rather than a fact.
     *
     * <p>{@code ref} points at the thing by kind and id. Turning that into a link is the
     * client's business; the server has no opinion about where a screen lives.
     */
    public record ProvenanceResponse(String formula, List<ProvenanceSection> sections, List<String> caveats) {
    }

    /** One side of the formula, with the figure the calculator arrived at for it. Never
     *  re-added in the browser (FRONTEND_CONVENTIONS §4 rule 2). */
    public record ProvenanceSection(
            String heading,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal total,
            List<ProvenanceLine> lines
    ) {
    }

    public record ProvenanceLine(
            String label,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
            RefResponse ref,
            boolean excluded
    ) {
    }

    public record RefResponse(Provenance.Ref.Kind kind, Long id) {
    }

    /**
     * @param months                null when unknown; never 0, which would read as "none"
     * @param upperBound            true when unpriced bills were left out — the UI must say
     *                              "at most", because essentials can only grow
     * @param coversEssentialsOnly  day-to-day spending is on top of this — the UI must say so
     */
    public record RunwayResponse(
            BigDecimal months,
            boolean upperBound,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal liquidTotal,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal monthlyEssentials,
            int unknownBillCount,
            String unknownReason,
            boolean coversEssentialsOnly,
            ProvenanceResponse basis
    ) {
    }

    /** @param perCycle null until there are at least two complete cycles to measure. */
    public record BaselineResponse(
            @JsonSerialize(using = MoneySerializer.class) BigDecimal perCycle,
            int cyclesObserved,
            LocalDate observedFrom,
            LocalDate observedTo,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal lowest,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal highest
    ) {
    }

    /**
     * @param emiMonthlyTotal  an <strong>obligation</strong> measure, never a cash-flow one:
     *                         a card-billed EMI arrives inside the card bill. Use the cycle's
     *                         {@code committed} for cash leaving.
     * @param emiShareOfIncome a fraction (0.37 = 37%), not a percentage
     */
    public record DebtResponse(
            @JsonSerialize(using = MoneySerializer.class) BigDecimal totalOutstanding,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal bankEmiMonthly,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal cardEmiMonthly,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal emiMonthlyTotal,
            BigDecimal emiShareOfIncome,
            BigDecimal weightedAverageRate,
            LocalDate debtFreeDate,
            int loanCount,
            int loansWithoutTerms,
            ProvenanceResponse basis
    ) {
    }
}
