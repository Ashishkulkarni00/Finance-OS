import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  /** A right-aligned qualifier - "₹1,193 available", "12 entries". Never the label. */
  hint?: string;
  /** 1 renders as a child of the option above it: indented, under a guide line. Used by
   *  the category picker for sub-categories (Transport → Fuel). Only 0 and 1 exist -
   *  the domain is one level deep by construction, see the backend's V12. */
  depth?: 0 | 1;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

/**
 * `chip` - a pill in a filter bar. `field` - a bordered box in a form.
 * `row` - borderless, sitting inside a ruled label/value row.
 */
type SelectVariant = 'chip' | 'field' | 'row';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Flat options, or `groups` for a long list that reads better sectioned - the
   *  category picker's Fixed/Flexible/One-off split. Exactly one of the two. */
  options?: SelectOption[];
  groups?: SelectGroup[];
  /** What the trigger reads when nothing is chosen. */
  placeholder?: string;
  /** Offer the placeholder as a choice inside the list, so picking it clears the value.
   *  On by default for `chip` - a filter clears itself by going back to "All accounts".
   *  Off by default for form fields, where "Choose one" is a prompt, not an answer: a
   *  required category offering "Choose one" as a row you can pick is an invitation to
   *  submit a form that will fail. Turn it on where empty genuinely is valid ("Not
   *  recorded"). */
  clearable?: boolean;
  variant?: SelectVariant;
  /** `chip` only: colour it as carrying a choice. */
  active?: boolean;
  /** Caps the closed width. */
  widthClass?: string;
  className?: string;
  ariaLabel?: string;
  /** A filter box above the list. Defaults to on once the list passes `SEARCH_FROM`
   *  options - a threshold rather than a per-call-site decision, so a list that grows
   *  past scrolling gains its filter without anyone remembering to add it. */
  searchable?: boolean;
  /** Pinned below the list, inside the panel - "+ New category". An action, so it sits
   *  under a rule rather than pretending to be one more option. */
  footer?: ReactNode;
  disabled?: boolean;
}

const SEARCH_FROM = 8;
const PANEL_MAX_HEIGHT = 352;
const PANEL_MIN_WIDTH = 224;
const PANEL_GAP = 4;
/** Clearance kept between the panel and the viewport edge. */
const VIEWPORT_MARGIN = 12;

/**
 * The trigger is a flex row - label, then chevron - rather than a padded box with the
 * chevron absolutely positioned over its right edge.
 *
 * <p>The absolute version depended on two numbers agreeing: the box's right padding and
 * the chevron's right offset. Both were spacing tokens, and one of each (`pr-space-7`,
 * `right-space-1`) did not exist in the theme, so Tailwind emitted nothing for them. In
 * the filter pills the label ran underneath the chevron; in the ruled rows the chevron
 * lost its offset entirely and sat on the first letter of the value ("Ircome"). As flex
 * siblings there is nothing to keep in agreement: the label truncates, the chevron never
 * shrinks, and they cannot overlap whatever the label's length.
 */
const TRIGGER: Record<SelectVariant, string> = {
  chip: 'h-8 gap-space-1 rounded-full border px-space-3 text-label',
  field: 'h-11 w-full justify-between gap-space-2 rounded-lg border border-border bg-surface px-space-3 text-label text-ink',
  // Sized to its value, not to its container - stretched full-width, the chevron ends up
  // a couple of hundred pixels from the text it belongs to. The hover tint is what makes
  // a borderless control still read as a control.
  row: 'gap-space-1 rounded-md px-space-1 py-[2px] text-label text-ink hover:bg-sunken',
};

/** A flat row in the rendered panel. Built once and walked by the keyboard handler, so
 *  arrow keys skip headings and dividers for free. */
type Entry =
  | { kind: 'heading'; label: string }
  | { kind: 'divider' }
  | { kind: 'option'; option: SelectOption; clear?: boolean };

function buildEntries(
  options: SelectOption[] | undefined,
  groups: SelectGroup[] | undefined,
  clearLabel: string | undefined,
  filter: string,
): Entry[] {
  const q = filter.trim().toLowerCase();
  const keep = (o: SelectOption) => q === '' || o.label.toLowerCase().includes(q);
  const entries: Entry[] = [];

  // Survives a search that doesn't match its own text - hiding "All accounts" while you
  // type would make "show everything again" unreachable from the keyboard.
  if (clearLabel) {
    entries.push({ kind: 'option', option: { value: '', label: clearLabel }, clear: true });
    entries.push({ kind: 'divider' });
  }

  if (groups) {
    for (const g of groups) {
      const kept = g.options.filter(keep);
      if (kept.length === 0) continue;
      entries.push({ kind: 'heading', label: g.label });
      for (const o of kept) entries.push({ kind: 'option', option: o });
    }
  } else {
    for (const o of options ?? []) if (keep(o)) entries.push({ kind: 'option', option: o });
  }
  return entries;
}

interface PanelPosition {
  left: number;
  top?: number;
  bottom?: number;
  minWidth: number;
  maxHeight: number;
}

/**
 * Where the panel goes. Opens below the trigger unless there is materially more room
 * above, and caps its height to the room it actually has - the previous version had a
 * fixed max height and a fixed flip threshold, so a picker near the bottom of the Edit
 * sheet opened below and ran off the bottom of the window.
 */
function positionFor(trigger: HTMLElement): PanelPosition {
  const r = trigger.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - PANEL_GAP - VIEWPORT_MARGIN;
  const above = r.top - PANEL_GAP - VIEWPORT_MARGIN;
  const flip = below < Math.min(PANEL_MAX_HEIGHT, 220) && above > below;
  const minWidth = Math.max(r.width, PANEL_MIN_WIDTH);
  const left = Math.max(VIEWPORT_MARGIN, Math.min(r.left, window.innerWidth - minWidth - VIEWPORT_MARGIN));

  return {
    left,
    minWidth,
    maxHeight: Math.min(PANEL_MAX_HEIGHT, flip ? above : below),
    ...(flip ? { bottom: window.innerHeight - r.top + PANEL_GAP } : { top: r.bottom + PANEL_GAP }),
  };
}

/**
 * Every dropdown in the product, one component - a real listbox, not a native `<select>`.
 *
 * <p>The native popup is drawn by the operating system: system font, blue highlight,
 * unstyled `<optgroup>` labels, and no room for search, sub-category indentation, a
 * per-option qualifier, or a "+ New" action. So this is a `<button>` trigger plus a
 * portalled panel. The portal is not decoration - the transaction form and the manage
 * sheet live inside a modal whose body scrolls and clips, and an in-flow panel would be
 * cut off by it.
 *
 * <p>Keyboard behaviour matches the element it replaces: Enter/Space/↓ opens, ↑↓ moves,
 * Home/End jump, Enter selects, Escape closes and returns focus to the trigger.
 */
export function Select({
  value,
  onChange,
  options,
  groups,
  placeholder,
  clearable,
  variant = 'field',
  active,
  widthClass,
  className,
  ariaLabel,
  searchable,
  footer,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const offerClear = (clearable ?? variant === 'chip') && !!placeholder;

  const flatOptions = useMemo(() => (groups ? groups.flatMap((g) => g.options) : (options ?? [])), [groups, options]);
  const entries = useMemo(
    () => buildEntries(options, groups, offerClear ? placeholder : undefined, filter),
    [options, groups, offerClear, placeholder, filter],
  );
  const optionIndexes = useMemo(
    () => entries.map((e, i) => (e.kind === 'option' && !e.option.disabled ? i : -1)).filter((i) => i >= 0),
    [entries],
  );

  const selected = flatOptions.find((o) => o.value === value);
  const showSearch = searchable ?? flatOptions.length >= SEARCH_FROM;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => triggerRef.current && setPosition(positionFor(triggerRef.current));
    place();
    // Capture phase: the scroll that moves this trigger is usually a *parent's* (the
    // modal body), which never bubbles to window.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Keep the keyboard-active row in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  // Opening lands on what's already chosen, not at the top - the difference between
  // "confirm this" and "start over".
  const openPanel = () => {
    if (disabled) return;
    setFilter('');
    const at = entries.findIndex((e) => e.kind === 'option' && e.option.value === value);
    setActiveIndex(at >= 0 ? at : (optionIndexes[0] ?? -1));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const commit = (option: SelectOption) => {
    onChange(option.value);
    close();
  };

  const move = (delta: number) => {
    if (optionIndexes.length === 0) return;
    const current = optionIndexes.indexOf(activeIndex);
    const next = current < 0 ? (delta > 0 ? 0 : optionIndexes.length - 1) : current + delta;
    setActiveIndex(optionIndexes[Math.max(0, Math.min(optionIndexes.length - 1, next))]!);
  };

  /**
   * Every key this handles stops propagating. The panel is portalled, but React still
   * bubbles its events through the component tree - so without this, Enter in the search
   * box reached the enclosing form's `handleEnterAdvance` and jumped focus to the next
   * field (or submitted), and Escape reached the modal and closed the whole sheet when
   * all you meant to close was the list.
   */
  const onKeyDown = (e: KeyboardEvent) => {
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        handled();
        openPanel();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        handled();
        close();
        break;
      case 'ArrowDown':
        handled();
        move(1);
        break;
      case 'ArrowUp':
        handled();
        move(-1);
        break;
      case 'Home':
        handled();
        setActiveIndex(optionIndexes[0] ?? -1);
        break;
      case 'End':
        handled();
        setActiveIndex(optionIndexes[optionIndexes.length - 1] ?? -1);
        break;
      case 'Enter': {
        handled();
        const entry = entries[activeIndex];
        if (entry?.kind === 'option') commit(entry.option);
        break;
      }
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <span className={cn('inline-flex min-w-0 max-w-full', variant === 'field' && 'w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
        className={cn(
          'inline-flex min-w-0 max-w-full items-center text-left outline-none transition-colors duration-150 disabled:opacity-50',
          TRIGGER[variant],
          widthClass,
          variant === 'chip' &&
            (active ? 'border-accent bg-accent-wash text-accent' : 'border-border text-ink-soft hover:bg-sunken'),
          variant === 'chip' && open && !active && 'bg-sunken',
          variant === 'field' && open && 'border-accent',
          variant === 'row' && open && 'bg-sunken',
        )}
      >
        <span className={cn('min-w-0 truncate', !selected && variant !== 'chip' && 'text-ink-muted')}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          size={variant === 'chip' ? 14 : 15}
          strokeWidth={1.75}
          aria-hidden
          className={cn(
            'shrink-0 transition-transform duration-150',
            open && 'rotate-180',
            variant === 'chip' && active ? 'text-accent' : 'text-ink-muted',
          )}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: position.left,
              top: position.top,
              bottom: position.bottom,
              minWidth: position.minWidth,
              maxWidth: 'min(22.5rem, calc(100vw - 1.5rem))',
              maxHeight: position.maxHeight,
              zIndex: 60,
            }}
            className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-8px_rgb(0_0_0/0.16)]"
          >
            {showSearch && (
              <div className="flex shrink-0 items-center gap-space-2 border-b border-line px-space-3 py-space-2">
                <Search size={14} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden />
                <input
                  autoFocus
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search"
                  autoComplete="off"
                  aria-label={ariaLabel ? `Search ${ariaLabel.toLowerCase()}` : 'Search options'}
                  className="min-w-0 flex-1 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted"
                />
              </div>
            )}

            {/* overflow-x-hidden: an indented sub-category used to push its row wider than
                the panel and put a horizontal scrollbar under the whole list. */}
            <div
              role="listbox"
              id={listboxId}
              aria-label={ariaLabel}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-space-1"
            >
              {optionIndexes.length === 0 ? (
                <p className="px-space-3 py-space-3 text-caption text-ink-muted">Nothing matches “{filter.trim()}”.</p>
              ) : (
                entries.map((entry, i) => {
                  if (entry.kind === 'divider') {
                    return <div key={`d-${i}`} aria-hidden className="mx-space-2 my-space-1 h-px bg-line" />;
                  }
                  if (entry.kind === 'heading') {
                    return (
                      <p
                        key={`h-${entry.label}`}
                        className="px-space-2 pb-space-1 pt-space-3 text-micro uppercase tracking-[0.08em] text-ink-muted first:pt-space-2"
                      >
                        {entry.label}
                      </p>
                    );
                  }

                  const { option } = entry;
                  const isSelected = option.value === value;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={`o-${option.value}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive}
                      disabled={option.disabled}
                      onMouseMove={() => !isActive && setActiveIndex(i)}
                      onClick={() => commit(option)}
                      className={cn(
                        'relative flex w-full min-w-0 items-center gap-space-2 rounded-md py-[7px] pr-space-2 text-left text-label transition-colors duration-100 disabled:opacity-40',
                        option.depth === 1 ? 'pl-space-6' : 'pl-space-2',
                        isActive && 'bg-sunken',
                        entry.clear ? 'text-ink-muted' : isSelected ? 'font-medium text-ink' : 'text-ink-soft',
                      )}
                    >
                      {/* The guide line makes a sub-category read as belonging to the name
                          above it; consecutive children share one continuous line. */}
                      {option.depth === 1 && (
                        <span aria-hidden className="absolute inset-y-0 left-[15px] w-px bg-line" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {option.hint && <span className="shrink-0 text-caption text-ink-muted">{option.hint}</span>}
                      <Check
                        size={14}
                        strokeWidth={2.25}
                        aria-hidden
                        className={cn('shrink-0 text-accent', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {footer && <div className="shrink-0 border-t border-line p-space-1">{footer}</div>}
          </div>,
          document.body,
        )}
    </span>
  );
}
