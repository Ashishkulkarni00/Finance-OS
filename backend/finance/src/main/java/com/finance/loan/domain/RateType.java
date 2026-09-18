package com.finance.loan.domain;

/** A floating rate makes every figure derived from it an estimate by definition, however
 *  precisely it was recorded - the workbook writes "16.5% floating" for exactly that
 *  reason. */
public enum RateType {
    FIXED,
    FLOATING
}
