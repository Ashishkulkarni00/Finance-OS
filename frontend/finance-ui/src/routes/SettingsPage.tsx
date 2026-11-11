import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { ErrorState } from '@/components/ErrorState';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { PageSubtitle } from '@/features/help/PageHelp';
import { ordinalDay } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { applyTheme, clearRemembered, readTheme, type ThemeChoice } from '@/lib/theme';
import { useGetMeQuery, useUpdateMeMutation } from '@/services/userService';
import type { AppError } from '@/types/errors';

const THEMES: { value: ThemeChoice; label: string; hint: string }[] = [
  { value: 'system', label: 'Match my device', hint: 'Light by day, dark at night - whatever your phone or laptop is set to.' },
  { value: 'light', label: 'Light', hint: 'Warm paper, always.' },
  { value: 'dark', label: 'Dark', hint: 'Easier on the eyes in a dim room.' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="max-w-[34rem]">
      <SectionHeader>{title}</SectionHeader>
      <div className="flex flex-col gap-space-3">{children}</div>
    </section>
  );
}

/**
 * Settings (UI_UX_REVAMP_PLAN 4.17): the few things a person might want to change about how Kosh looks
 * and who it says you are. Everything here is either `GET/PATCH /me` or a per-browser preference.
 *
 * <p>**Pay day is shown, not editable.** Changing it re-draws every month, and existing months and
 * closed snapshots make that unsafe to offer as a casual field (Appendix A #5). Saying so is more
 * honest than a disabled input.
 */
export default function SettingsPage() {
  const { data: me, isLoading, isError, refetch } = useGetMeQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();

  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (me) setName(me.displayName ?? '');
  }, [me]);

  const [theme, setTheme] = useState<ThemeChoice>(readTheme);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetNote, setResetNote] = useState<string | null>(null);

  const changed = me != null && name.trim() !== (me.displayName ?? '') && name.trim().length > 0;

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!changed) return;
    setError(null);
    setSaved(false);
    try {
      await updateMe({ displayName: name.trim() }).unwrap();
      setSaved(true);
    } catch (err) {
      setError((err as AppError).message ?? "Couldn't save that. Try again.");
    }
  };

  const choose = (choice: ThemeChoice) => {
    setTheme(choice);
    applyTheme(choice);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-24 w-full max-w-[34rem]" />
      </div>
    );
  }
  if (isError || !me) {
    return <ErrorState message="We couldn't load your settings. Check your connection and try again." onRetry={refetch} />;
  }

  return (
    <div className="reveal-shell flex w-full flex-col gap-10">
      <header className="flex flex-col gap-space-1">
        <h1 className="text-page text-ink">Settings</h1>
        <PageSubtitle>How Kosh looks, and what it calls you.</PageSubtitle>
      </header>

      <Section title="Your name">
        <form onSubmit={saveName} className="flex flex-col gap-space-3">
          <label className="flex flex-col gap-space-1">
            <span className="text-label text-ink-soft">Display name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              autoComplete="name"
              maxLength={80}
              className="h-9 rounded-lg border border-border bg-surface px-space-3 text-label text-ink outline-none transition-colors duration-150 hover:border-ink-muted focus:border-accent pointer-coarse:h-11"
            />
          </label>
          <p className="text-caption text-ink-muted">Signed in as {me.email}.</p>
          <div className="flex items-center gap-space-3">
            <Button type="submit" variant="primary" disabled={!changed || saving}>
              {saving ? 'Saving…' : 'Save name'}
            </Button>
            {saved && (
              <span role="status" className="text-caption text-positive">
                Saved.
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className="text-caption text-critical">
              {error}
            </p>
          )}
        </form>
      </Section>

      <Section title="Appearance">
        <div role="radiogroup" aria-label="Colour theme" className="flex flex-col">
          {THEMES.map((t) => {
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(t.value)}
                className={cn(
                  'flex items-start gap-space-3 border-b border-line py-space-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-sunken/60',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-accent' : 'border-border',
                  )}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-accent" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-label', active ? 'font-medium text-ink' : 'text-ink-soft')}>{t.label}</span>
                  <span className="block text-caption text-ink-muted">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-caption text-ink-muted">Remembered on this device only.</p>
      </Section>

      <Section title="Pay day">
        <p className="text-body text-ink">
          The <span className="num font-medium">{ordinalDay(me.cycleStartDay)}</span> of every month.
        </p>
        <p className="text-caption text-ink-muted">
          Your financial month runs from one pay day to the next. Changing it re-draws every month, including ones already
          recorded, so it can’t be edited here yet.
        </p>
      </Section>

      <Section title="What Kosh remembers on this device">
        <p className="text-caption text-ink-muted">
          Which sections you left open, the account and categories you used last, and the dismissed tips. None of it is your
          financial data - clearing it only puts the screens back to how they first looked.
        </p>
        <div className="flex items-center gap-space-3">
          <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
            Reset what’s remembered
          </Button>
          {resetNote && (
            <span role="status" className="text-caption text-positive">
              {resetNote}
            </span>
          )}
        </div>
      </Section>

      <Dialog
        open={confirmingReset}
        title="Reset what Kosh remembers?"
        body="Sections will start closed again and the Add form will forget your last account and categories. Your accounts, entries and plan are not touched. Your light or dark choice is kept."
        confirmLabel="Reset"
        onConfirm={() => {
          const n = clearRemembered();
          setConfirmingReset(false);
          setResetNote(n === 0 ? 'Nothing was remembered.' : `Cleared ${n} remembered ${n === 1 ? 'choice' : 'choices'}. Screens start fresh next time you open them.`);
        }}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  );
}
