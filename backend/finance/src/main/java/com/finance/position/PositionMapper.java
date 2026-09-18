package com.finance.position;

import com.finance.position.dto.Blocker;
import com.finance.position.dto.CashPositionResponse;
import com.finance.position.dto.NetWorthResponse;
import com.finance.position.dto.PositionBreakdown;
import com.finance.position.dto.PositionResponse;
import org.springframework.stereotype.Component;

@Component
public class PositionMapper {

    public PositionResponse toResponse(PositionResult result) {
        if (!result.complete()) {
            var blockers = result.blockers().stream()
                    .map(b -> new Blocker(String.valueOf(b.commitmentInstanceId()), b.name(), b.fix()))
                    .toList();
            return PositionResponse.incomplete(result.incompleteReason(), blockers);
        }

        var accounts = result.accountBalances().stream()
                .map(a -> new PositionBreakdown.AccountContribution(a.accountId(), a.name(), a.balance()))
                .toList();
        var commitments = result.openInstances().stream()
                .map(c -> new PositionBreakdown.CommitmentContribution(c.commitmentInstanceId(), c.name(),
                        c.outstanding(), c.mandatory()))
                .toList();
        var cards = result.cardBalances().stream()
                .map(a -> new PositionBreakdown.AccountContribution(a.accountId(), a.name(), a.balance()))
                .toList();
        PositionBreakdown breakdown = new PositionBreakdown(result.held(), result.reserved(), result.committed(),
                result.optionalCommitted(), result.cardDues(), accounts, commitments, cards);

        return PositionResponse.ok(result.realBalance(), result.roomToday(), result.roomLeft(), result.spentToday(), breakdown);
    }

    public CashPositionResponse toResponse(CashPosition result) {
        return new CashPositionResponse(result.heldTotal(), result.reservedTotal(), result.unreservedTotal(),
                result.cardLiability(), result.accountCount());
    }

    public NetWorthResponse toResponse(NetWorthResult result) {
        return new NetWorthResponse(result.netWorth(), result.totalAssets(), result.totalLiabilities(), result.totalDebt());
    }
}
