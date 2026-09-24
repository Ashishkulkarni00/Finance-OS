package com.finance.state;

import com.finance.commitment.CommitmentMapper;
import com.finance.cycle.domain.Cycle;
import com.finance.position.PositionMapper;
import com.finance.state.dto.FinancialStateResponse;
import org.springframework.stereotype.Component;

/** Shapes {@link FinancialState} for the wire, reusing each area's own mapper. */
@Component
public class FinancialStateMapper {

    private final PositionMapper positionMapper;
    private final CommitmentMapper commitmentMapper;

    public FinancialStateMapper(PositionMapper positionMapper, CommitmentMapper commitmentMapper) {
        this.positionMapper = positionMapper;
        this.commitmentMapper = commitmentMapper;
    }

    public FinancialStateResponse toResponse(FinancialState state) {
        Cycle cycle = state.cycle();
        return new FinancialStateResponse(
                state.asOf(),
                new FinancialStateResponse.CycleRef(cycle.getId(), cycle.getStartDate(), cycle.getEndDate(), cycle.label()),
                state.daysToSalary(),
                state.complete(),
                positionMapper.toResponse(state.position()),
                commitmentMapper.toResponse(state.shape()),
                positionMapper.toResponse(state.netWorth()),
                runway(state.runway()),
                baseline(state.baseline()),
                debt(state.debt()),
                state.attentionCount());
    }

    private FinancialStateResponse.RunwayResponse runway(Runway r) {
        return new FinancialStateResponse.RunwayResponse(
                r.months(), r.upperBound(), r.liquidTotal(), r.monthlyEssentials(),
                r.unknownBillCount(), r.unknownReason(), r.coversEssentialsOnly(), basis(r.basis()));
    }

    private FinancialStateResponse.BaselineResponse baseline(SpendBaseline b) {
        return new FinancialStateResponse.BaselineResponse(
                b.perCycle(), b.cyclesObserved(), b.observedFrom(), b.observedTo(), b.lowest(), b.highest());
    }

    /** Null in, null out: a figure with no derivation simply has no "why" to offer. */
    private FinancialStateResponse.ProvenanceResponse basis(Provenance p) {
        if (p == null) {
            return null;
        }
        return new FinancialStateResponse.ProvenanceResponse(
                p.formula(),
                p.sections().stream()
                        .map(sec -> new FinancialStateResponse.ProvenanceSection(
                                sec.heading(), sec.total(),
                                sec.lines().stream()
                                        .map(l -> new FinancialStateResponse.ProvenanceLine(
                                                l.label(), l.amount(),
                                                l.ref() == null ? null
                                                        : new FinancialStateResponse.RefResponse(l.ref().kind(), l.ref().id()),
                                                l.excluded()))
                                        .toList()))
                        .toList(),
                p.caveats());
    }

    private FinancialStateResponse.DebtResponse debt(DebtPosition d) {
        return new FinancialStateResponse.DebtResponse(
                d.totalOutstanding(), d.bankEmiMonthly(), d.cardEmiMonthly(), d.emiMonthlyTotal(),
                d.emiShareOfIncome(), d.weightedAverageRate(), d.debtFreeDate(),
                d.loanCount(), d.loansWithoutTerms(), basis(d.basis()));
    }
}
