import type { DocBlock, DocField } from '../types';

/** IN_APP_MANUAL.md §5a's craft table: "Worked out for you", not "Filled in for you" -
 *  matching the vocabulary the fields list itself is described with. */
const REQUIREMENT_LABEL: Record<DocField['requirement'], string> = {
  required: 'Required',
  optional: 'Optional',
  auto: 'Worked out for you',
};

const REQUIREMENT_TONE: Record<DocField['requirement'], string> = {
  required: 'text-ink-soft',
  optional: 'text-ink-muted',
  auto: 'text-accent',
};

function ProseBlock({ text }: { text: string }) {
  return <p className="text-body text-ink-soft">{text}</p>;
}

function StepsBlock({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-space-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-space-3 text-body text-ink-soft">
          <span className="num mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-medium text-ink-soft">
            {i + 1}
          </span>
          <span className="pt-px">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** A definition list, not cards - §5a: "Label in --ink, the explanation in --ink-soft,
 *  and a quiet right-aligned Required / Optional / Worked out for you marker." Rows are
 *  separated by a hairline, not each boxed on its own - a box is reserved for things that
 *  *are* boxed (an example, a callout, a table). */
function FieldsBlock({ intro, items }: { intro?: string; items: DocField[] }) {
  return (
    <div className="flex flex-col gap-space-3">
      {intro && <p className="text-caption text-ink-muted">{intro}</p>}
      <dl className="flex flex-col divide-y divide-line">
        {items.map((f) => (
          <div key={f.label} className="py-space-3 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-space-2">
              <dt className="text-label font-medium text-ink">{f.label}</dt>
              <span className={`text-micro uppercase tracking-[0.06em] ${REQUIREMENT_TONE[f.requirement]}`}>
                {REQUIREMENT_LABEL[f.requirement]}
              </span>
            </div>
            <dd className="mt-space-1 text-caption text-ink-soft">{f.what}</dd>
            {f.example && <dd className="mt-space-1 text-caption text-ink-muted">e.g. {f.example}</dd>}
            {f.whereToFind && <dd className="mt-space-1 text-caption text-ink-muted">Find it: {f.whereToFind}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

function QaBlock({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="flex flex-col divide-y divide-line">
      {items.map((qa) => (
        <div key={qa.question} className="py-space-3 first:pt-0">
          <p className="text-label text-ink">{qa.question}</p>
          <p className="mt-space-1 text-caption text-ink-muted">{qa.answer}</p>
        </div>
      ))}
    </div>
  );
}

function TermsBlock({ items }: { items: { term: string; means: string }[] }) {
  return (
    <div className="flex flex-col divide-y divide-line">
      {items.map((t) => (
        <div key={t.term} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-space-3 py-space-3 first:pt-0">
          <span className="text-label font-medium text-ink">{t.term}</span>
          <span className="text-caption text-ink-muted">{t.means}</span>
        </div>
      ))}
    </div>
  );
}

/** The manual's most valuable block, styled to look it - §5a: "--sunken panel, hairline,
 *  figures right-aligned and tabular-aligned like every other figure in the product." */
function ExampleBlock({ title, lines, note }: { title: string; lines: { label: string; value: string }[]; note?: string }) {
  return (
    <div className="rounded-lg border border-line bg-sunken px-space-4 py-space-4">
      <p className="mb-space-3 text-label font-medium text-ink">{title}</p>
      <div className="flex flex-col gap-space-2">
        {lines.map((l) => (
          <div key={l.label} className="flex items-baseline justify-between gap-space-4">
            <span className="text-caption text-ink-soft">{l.label}</span>
            <span className="num text-label text-ink">{l.value}</span>
          </div>
        ))}
      </div>
      {note && <p className="mt-space-3 text-caption text-ink-muted">{note}</p>}
    </div>
  );
}

/** §5a: "A 3px left edge in --attention or --accent, no fill, no icon-in-a-circle. The
 *  app's own toast language" - editorial, not a coloured alert box. */
function CalloutBlock({ tone, text }: { tone: 'note' | 'warn'; text: string }) {
  return (
    <div className={`border-l-[3px] py-space-1 pl-space-4 ${tone === 'warn' ? 'border-attention' : 'border-accent'}`}>
      <p className="text-body text-ink-soft">{text}</p>
    </div>
  );
}

function TableBlock({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-sunken">
            {head.map((h, i) => (
              <th key={i} className="px-space-4 py-space-2 text-micro uppercase tracking-[0.06em] text-ink-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className={`px-space-4 py-space-3 text-caption ${j === 0 ? 'font-medium text-ink' : 'text-ink-soft'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ElsewhereBlock({ items }: { items: { thing: string; where: string; to?: string }[] }) {
  return (
    <div className="flex flex-col gap-space-2">
      {items.map((e) => (
        <p key={e.thing} className="text-caption text-ink-soft">
          <span className="text-ink">{e.thing}</span> <span aria-hidden>&mdash;</span> {e.where}
        </p>
      ))}
    </div>
  );
}

/** Dispatches one `DocBlock` to its renderer - the only place that switches on `kind`. */
export function DocBlockRenderer({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case 'prose':
      return <ProseBlock text={block.text} />;
    case 'steps':
      return <StepsBlock items={block.items} />;
    case 'fields':
      return <FieldsBlock intro={block.intro} items={block.items} />;
    case 'qa':
      return <QaBlock items={block.items} />;
    case 'terms':
      return <TermsBlock items={block.items} />;
    case 'example':
      return <ExampleBlock title={block.title} lines={block.lines} note={block.note} />;
    case 'callout':
      return <CalloutBlock tone={block.tone} text={block.text} />;
    case 'table':
      return <TableBlock head={block.head} rows={block.rows} />;
    case 'elsewhere':
      return <ElsewhereBlock items={block.items} />;
    default:
      return null;
  }
}
