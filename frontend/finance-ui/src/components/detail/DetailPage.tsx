import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';

/**
 * The one layout for every record's own page - account, credit card, loan, goal, commitment and
 * its rule (UI_UX_REVAMP_PLAN 4.8). Learn it once:
 *
 * <pre>
 *   ‹ Back
 *   Name  [status]                          [Primary action] [Edit]
 *   one line of identity
 *   LABEL
 *   ₹hero figure
 *   one sentence of what it means
 *   Fact | Fact | Fact                       (FactStrip, 2-4 facts)
 *   ... the sections you come here for ...
 *   ... the working, folded (Disclosure) ...
 *   Archive or delete                         (DangerZone, at the bottom, never in the header)
 * </pre>
 *
 * Full-width and left-aligned like every other page (no `mx-auto`); prose inside keeps its own
 * reading measure.
 */
export function DetailPage({ backLabel, backTo, children }: { backLabel: string; backTo: string; children: ReactNode }) {
  const navigate = useNavigate();
  // react-router stamps `idx` on history state: > 0 means there is somewhere in-app to go back to.
  const canGoBack = (window.history.state as { idx?: number } | null)?.idx != null && (window.history.state as { idx: number }).idx > 0;

  return (
    // `detail-page`: on a phone each top-level section becomes a card (index.css).
    <div className="detail-page reveal-shell flex w-full flex-col gap-space-6 md:gap-10">
      <button
        type="button"
        onClick={() => (canGoBack ? navigate(-1) : navigate(backTo))}
        className="-ml-space-1 flex items-center gap-space-1 self-start rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
        {canGoBack ? 'Back' : `Back to ${backLabel}`}
      </button>
      {children}
    </div>
  );
}

export function DetailLoading() {
  return (
    <div className="flex flex-col gap-space-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-11 w-48" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

/**
 * A page that could not be shown. A 404 (the record does not exist, was deleted, or belongs to
 * someone else - the server answers all three alike) is not an error to retry: it says the thing
 * could not be found and offers the way back (UI_UX_REVAMP_PLAN 4.16).
 */
export function DetailError({
  what,
  backTo,
  backLabel,
  error,
  onRetry,
}: {
  what: string;
  backTo: string;
  backLabel: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const missing = (error as { status?: number } | undefined)?.status === 404;
  return (
    <div className="flex flex-col items-start gap-space-3">
      <ErrorState
        message={missing ? `We couldn't find this ${what}. It may have been deleted.` : `We couldn't load this ${what}.`}
        onRetry={missing ? undefined : onRetry}
      />
      <Link to={backTo} className="text-label text-accent underline-offset-4 hover:underline">
        Back to {backLabel}
      </Link>
    </div>
  );
}

/** Name, status chips, one line of identity, and the page's actions. */
export function DetailHeader({
  title,
  chips,
  subtitle,
  actions,
}: {
  title: string;
  chips?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-space-1">
      {/* Phone: the row dissolves (`contents`) so the order reads name, identity line, then
          actions - not name, buttons, and the "Needed by" line stranded under them. */}
      <div className="flex flex-wrap items-center justify-between gap-x-space-4 gap-y-space-2 max-md:contents">
        <div className="flex min-w-0 flex-wrap items-center gap-space-3 max-md:order-1">
          {/* A record's name is longer than a section's ("Emergency fund contribution"), so on a
              phone it steps down a size rather than truncating at 38px. */}
          <h1 className="text-page min-w-0 truncate text-ink max-md:text-[26px] max-md:leading-8">{title}</h1>
          {chips}
        </div>
        {/* Phone: actions on their own line under the name, never wedged beside it. */}
        {actions && <div className="flex flex-wrap items-center gap-space-2 max-md:order-3 max-md:mt-space-3">{actions}</div>}
      </div>
      {subtitle && <p className="max-w-[62ch] text-[13px] leading-5 text-ink-muted max-md:order-2">{subtitle}</p>}
    </header>
  );
}

/** The one figure the page is about, with its label above and one sentence beneath. */
export function DetailHero({ label, sentence, children }: { label: ReactNode; sentence?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <span className="text-caption text-ink-muted">{label}</span>
      <div className="mt-space-1">{children}</div>
      {sentence && <p className="mt-space-2 max-w-[34rem] text-body text-ink-soft">{sentence}</p>}
    </section>
  );
}

/** A record that has been archived or stopped, and the way back - the undo for archiving. */
export function ArchivedNotice({
  title,
  body,
  actionLabel,
  busy,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  busy?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-3 rounded-xl bg-sunken px-space-4 py-space-3">
      <div className="flex min-w-0 flex-col gap-space-1">
        <p className="text-label font-medium text-ink">{title}</p>
        <p className="max-w-[62ch] text-caption text-ink-muted">{body}</p>
      </div>
      <Button variant="secondary" size="sm" disabled={busy} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

export interface DangerItemProps {
  title: string;
  /** What happens, in one plain sentence - the consequence, before the user acts. */
  body: string;
  actionLabel: string;
  onAction: () => void | Promise<void>;
  busy?: boolean;
  /** Ask first, in a dialog that repeats the consequence. */
  confirm?: { title: string; body: string; confirmLabel: string };
  /** The loud (red) variant, for things that cannot be brought back. */
  destructive?: boolean;
}

function DangerRow({ item }: { item: DangerItemProps }) {
  const [asking, setAsking] = useState(false);
  const act = async () => {
    setAsking(false);
    await item.onAction();
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-3 border-b border-line py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-label font-medium text-ink">{item.title}</p>
        <p className="mt-[2px] max-w-[62ch] text-caption text-ink-muted">{item.body}</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={item.busy}
        onClick={() => (item.confirm ? setAsking(true) : void act())}
        className={item.destructive ? 'border-critical/40 text-critical hover:bg-critical/10' : undefined}
      >
        {item.actionLabel}
      </Button>
      {item.confirm && (
        <Dialog
          open={asking}
          title={item.confirm.title}
          body={item.confirm.body}
          confirmLabel={item.confirm.confirmLabel}
          destructive={item.destructive}
          busy={item.busy}
          onConfirm={() => void act()}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
}

/**
 * Archive and delete, last on the page and out of the header (UI_UX_REVAMP_PLAN 4.8): rare,
 * consequential actions should not sit beside Edit where a slip reaches them. Each row says what
 * will happen before it can be pressed, and asks again in a dialog.
 */
export function DangerZone({ items, error }: { items: DangerItemProps[]; error?: string | null }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Archive or delete">
      <h2 className="text-sectiontitle text-ink">Archive or delete</h2>
      <div className="mt-space-2 border-t border-line">
        {items.map((item) => (
          <DangerRow key={item.title} item={item} />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-space-2 text-caption text-critical">
          {error}
        </p>
      )}
    </section>
  );
}
