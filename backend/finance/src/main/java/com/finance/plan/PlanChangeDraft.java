package com.finance.plan;

import com.finance.common.money.MoneyScale;
import com.finance.plan.domain.PlanRevisionType;
import com.finance.plan.domain.PlanSubjectType;
import com.finance.plan.domain.PlanValueKind;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * What a domain service hands to {@link PlanRevisionRecorder} - the change it is about to
 * make, described before it is persisted.
 *
 * <p>Built by the caller because only the caller knows the plain language: the commitment
 * package knows {@code dueDay} reads "Due day", the goal package knows {@code targetDate}
 * reads "Target date". Keeping labels here would put them a package away from the domain
 * that owns them (ADR-0015).
 *
 * <p>The {@code was} / {@code now} methods each skip a field that did not actually move,
 * so a service can offer every field it touched and only the real changes are logged.
 */
public final class PlanChangeDraft {

    /** One field that moved, before it becomes a row. */
    record Line(String field, String label, PlanValueKind kind, String oldValue, String newValue) {
    }

    private final PlanSubjectType subjectType;
    private final Long subjectId;
    private final String subjectName;
    private final PlanRevisionType revisionType;
    private final List<Line> lines = new ArrayList<>();

    private LocalDate effectiveFrom;
    private String reason;
    private Long supersededSubjectId;
    private BigDecimal monthlyEffect;

    private PlanChangeDraft(PlanSubjectType subjectType, Long subjectId, String subjectName,
                            PlanRevisionType revisionType) {
        this.subjectType = subjectType;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.revisionType = revisionType;
    }

    public static PlanChangeDraft forCommitment(Long id, String name, PlanRevisionType type) {
        return new PlanChangeDraft(PlanSubjectType.COMMITMENT, id, name, type);
    }

    public static PlanChangeDraft forGoal(Long id, String name, PlanRevisionType type) {
        return new PlanChangeDraft(PlanSubjectType.GOAL, id, name, type);
    }

    /** The first day the change is in force. Defaults to today if never set. */
    public PlanChangeDraft effectiveFrom(LocalDate date) {
        this.effectiveFrom = date;
        return this;
    }

    /** The user's own words, if they gave any. Blank is treated as none. */
    public PlanChangeDraft reason(String reason) {
        this.reason = reason == null || reason.isBlank() ? null : reason.trim();
        return this;
    }

    /** The rule this one replaced - only meaningful on {@code SUPERSEDED}. */
    public PlanChangeDraft supersedes(Long previousSubjectId) {
        this.supersededSubjectId = previousSubjectId;
        return this;
    }

    /**
     * What this costs per month: positive means more money is needed each month. Both
     * figures are the monthly cash requirement before and after; either being null leaves
     * the effect unknown rather than zero (ADR-0006).
     */
    public PlanChangeDraft monthlyEffect(BigDecimal before, BigDecimal after) {
        this.monthlyEffect = before == null || after == null
                ? null
                : MoneyScale.normalise(after.subtract(before));
        return this;
    }

    /** An effect already worked out by the caller. */
    public PlanChangeDraft monthlyEffect(BigDecimal effect) {
        this.monthlyEffect = MoneyScale.normalise(effect);
        return this;
    }

    public PlanChangeDraft money(String field, String label, BigDecimal before, BigDecimal after) {
        if (MoneyScale.equal(before, after)) {
            return this;
        }
        return line(field, label, PlanValueKind.MONEY, text(MoneyScale.normalise(before)), text(MoneyScale.normalise(after)));
    }

    public PlanChangeDraft date(String field, String label, LocalDate before, LocalDate after) {
        return changed(field, label, PlanValueKind.DATE, before, after);
    }

    public PlanChangeDraft number(String field, String label, Number before, Number after) {
        return changed(field, label, PlanValueKind.NUMBER, before, after);
    }

    public PlanChangeDraft flag(String field, String label, Boolean before, Boolean after) {
        return changed(field, label, PlanValueKind.FLAG, before, after);
    }

    /** Free text, or an enum - {@code toString} is what gets stored. */
    public PlanChangeDraft text(String field, String label, Object before, Object after) {
        return changed(field, label, PlanValueKind.TEXT, before, after);
    }

    private PlanChangeDraft changed(String field, String label, PlanValueKind kind, Object before, Object after) {
        String oldValue = text(before);
        String newValue = text(after);
        if (java.util.Objects.equals(oldValue, newValue)) {
            return this;
        }
        return line(field, label, kind, oldValue, newValue);
    }

    private PlanChangeDraft line(String field, String label, PlanValueKind kind, String oldValue, String newValue) {
        lines.add(new Line(field, label, kind, truncate(oldValue), truncate(newValue)));
        return this;
    }

    private static String text(Object value) {
        return value == null ? null : value.toString();
    }

    private static String truncate(String value) {
        return value == null || value.length() <= 255 ? value : value.substring(0, 255);
    }

    /**
     * Whether this is worth recording. An amendment that moved nothing is not an event -
     * saving a form without touching it should leave no trace. Every other kind of
     * revision is an event in itself, even with no field lines: pausing a SIP changes no
     * field but is very much a decision.
     */
    public boolean isWorthRecording() {
        return !lines.isEmpty()
                || revisionType != PlanRevisionType.AMENDED;
    }

    PlanSubjectType subjectType() {
        return subjectType;
    }

    Long subjectId() {
        return subjectId;
    }

    String subjectName() {
        return subjectName;
    }

    PlanRevisionType revisionType() {
        return revisionType;
    }

    LocalDate effectiveFromOr(LocalDate fallback) {
        return effectiveFrom == null ? fallback : effectiveFrom;
    }

    String reason() {
        return reason;
    }

    Long supersededSubjectId() {
        return supersededSubjectId;
    }

    BigDecimal monthlyEffectValue() {
        return monthlyEffect;
    }

    List<Line> lines() {
        return lines;
    }
}
