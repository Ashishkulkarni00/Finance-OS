package com.finance.position;

import java.math.BigDecimal;

/**
 * What's actually in the bank and the wallet, and how much of it is already claimed.
 *
 * <p>The source Excel's Accounts sheet ends with exactly this block, over the rows it
 * marks "In Cash Total? = Yes" - total, reserved, unreserved, and the card liability
 * kept separate. It answers a different question from net worth, which folds in
 * investments and loans and so cannot tell you what you can actually move today.
 *
 * <p>Deliberately independent of Real Balance: {@code /position} goes INCOMPLETE when a
 * mandatory commitment's amount is unknown, which is right for "what can I spend" and
 * wrong here - not knowing what a bill will cost doesn't make the money in the account
 * unknown. Accounts must still be able to state what's held.
 *
 * @param heldTotal       every spendable bank and cash account, summed
 * @param reservedTotal   what's spoken for across those accounts
 * @param unreservedTotal held − reserved; before commitments, so larger than Real Balance
 * @param cardLiability   owed on credit cards, expressed positive as an amount owed
 */
public record CashPosition(
        BigDecimal heldTotal,
        BigDecimal reservedTotal,
        BigDecimal unreservedTotal,
        BigDecimal cardLiability,
        int accountCount
) {
}
