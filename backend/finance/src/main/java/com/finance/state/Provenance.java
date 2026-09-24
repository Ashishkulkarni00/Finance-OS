package com.finance.state;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * What produced a figure (ROADMAP 2.3, {@code FINANCIAL_STATE.md} §2, Principle 4).
 *
 * <p>Every derived figure in this product is computed rather than stored, which is what keeps
 * it honest — and also what makes it opaque. "Runway: 1.7 months" is a claim until you can
 * see the five balances and eleven bills behind it. The {@code blockers} list on
 * {@code PositionResult} already does this for Real Balance; this generalises the idea so any
 * figure can answer <em>why is this number what it is?</em>
 *
 * <p><strong>Excluded inputs are carried, not dropped.</strong> A bill with no amount is part
 * of the answer to "why", and often the most important part: it is the reason the figure is a
 * ceiling rather than a fact. A derivation that silently omitted what it could not use would
 * be the same confident half-truth ADR-0006 exists to prevent.
 *
 * <p><strong>References are typed, not routed.</strong> A line points at an account or a
 * commitment by kind and id; turning that into a URL is the frontend's business. The server
 * has no opinion about where a screen lives.
 *
 * <p><strong>Inputs are grouped into the sides of the formula.</strong> "What you could
 * reach ÷ must-pay bills a month" promises two quantities, and a flat list of fifteen rows
 * does not show them — the reader cannot see which five make the first and which ten make
 * the second. Each section carries its own subtotal, taken from the calculator that already
 * summed it; the browser is never asked to add money up.
 *
 * @param formula  the rule in the user's words, e.g. "what you could reach ÷ must-pay bills a
 *                 month" — never algebra
 * @param sections the inputs, grouped as the formula reads
 * @param caveats  what the figure cannot account for, in plain words
 */
public record Provenance(String formula, List<Section> sections, List<String> caveats) {

    /**
     * One side of the derivation.
     *
     * @param total the section's own figure, from the calculator - never re-added downstream
     */
    public record Section(String heading, BigDecimal total, List<Line> lines) {
    }

    /**
     * One input.
     *
     * @param amount null when the input has no known amount - which is exactly when
     *               {@code excluded} matters
     * @param excluded true when this was left out of the figure; it is still shown, because
     *                 it explains why the figure is what it is
     */
    public record Line(String label, BigDecimal amount, Ref ref, boolean excluded) {
    }

    /** A pointer back to the thing itself, for a UI that wants to link to it. */
    public record Ref(Kind kind, Long id) {

        public enum Kind {ACCOUNT, COMMITMENT, LOAN, GOAL, INVESTMENT}
    }

    /** Fluent builder - these are assembled inside loops that are already doing the sums. */
    public static Builder of(String formula) {
        return new Builder(formula);
    }

    public static final class Builder {

        private final String formula;
        private final List<Section> sections = new ArrayList<>();
        private final List<String> caveats = new ArrayList<>();
        private String heading;
        private List<Line> lines = new ArrayList<>();

        private Builder(String formula) {
            this.formula = formula;
        }

        /** Opens a side of the formula. Closed by {@link #total} or by the next section. */
        public Builder section(String heading) {
            flush(null);
            this.heading = heading;
            return this;
        }

        /** Closes the open section with the figure its own calculator arrived at. */
        public Builder total(BigDecimal total) {
            flush(total);
            return this;
        }

        public Builder line(String label, BigDecimal amount, Ref.Kind kind, Long id) {
            lines.add(new Line(label, amount, kind == null ? null : new Ref(kind, id), false));
            return this;
        }

        /** Shown in the reading, deliberately not counted in the figure. */
        public Builder excluded(String label, Ref.Kind kind, Long id) {
            lines.add(new Line(label, null, kind == null ? null : new Ref(kind, id), true));
            return this;
        }

        public Builder caveat(String caveat) {
            if (caveat != null && !caveat.isBlank()) {
                caveats.add(caveat);
            }
            return this;
        }

        public Provenance build() {
            flush(null);
            return new Provenance(formula, List.copyOf(sections), List.copyOf(caveats));
        }

        private void flush(BigDecimal total) {
            if (heading != null || !lines.isEmpty()) {
                sections.add(new Section(heading, total, List.copyOf(lines)));
            }
            heading = null;
            lines = new ArrayList<>();
        }
    }
}
