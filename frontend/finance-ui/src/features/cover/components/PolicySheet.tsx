import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useGetLoansQuery } from '@/services/loanService';
import {
  useCreateInsurancePolicyMutation,
  useDeleteInsurancePolicyMutation,
  useUpdateInsurancePolicyMutation,
} from '@/services/insuranceService';
import type { InsurancePolicyResponse, InsuranceType, PremiumFrequency } from '@/types/insurance';

const TYPES: { value: InsuranceType; label: string }[] = [
  { value: 'HEALTH', label: 'Health' },
  { value: 'LIFE', label: 'Life' },
  { value: 'MOTOR', label: 'Motor' },
  { value: 'HOME', label: 'Home' },
  { value: 'OTHER', label: 'Other' },
];

const FREQUENCIES: { value: PremiumFrequency; label: string }[] = [
  { value: 'ANNUAL', label: 'Every year' },
  { value: 'HALF_YEARLY', label: 'Every 6 months' },
  { value: 'QUARTERLY', label: 'Every 3 months' },
  { value: 'MONTHLY', label: 'Every month' },
  { value: 'ONE_OFF', label: 'Paid once' },
];

const VALID_AMOUNT = /^\d+(\.\d{1,2})?$/;

interface PolicySheetProps {
  open: boolean;
  onClose: () => void;
  /** Editing an existing policy; omitted means adding a new one. */
  policy?: InsurancePolicyResponse | null;
}

/**
 * Add or edit a policy.
 *
 * <p>Only the name and what it covers are required. Everything else is optional on purpose:
 * "I'm covered but I can't remember for how much" is a true state, and refusing the record
 * until every box is filled loses the fact that cover exists at all (ADR-0006).
 */
export function PolicySheet({ open, onClose, policy }: PolicySheetProps) {
  const editing = policy != null;
  const { data: loansPage } = useGetLoansQuery();
  const [create, { isLoading: creating }] = useCreateInsurancePolicyMutation();
  const [update, { isLoading: updating }] = useUpdateInsurancePolicyMutation();
  const [remove, { isLoading: removing }] = useDeleteInsurancePolicyMutation();

  const [type, setType] = useState<InsuranceType>(policy?.type ?? 'HEALTH');
  const [name, setName] = useState(policy?.name ?? '');
  const [insurer, setInsurer] = useState(policy?.insurer ?? '');
  const [lastFour, setLastFour] = useState(policy?.policyLastFour ?? '');
  const [cover, setCover] = useState(policy?.coverAmount ?? '');
  const [premium, setPremium] = useState(policy?.premium ?? '');
  const [frequency, setFrequency] = useState<PremiumFrequency | ''>(policy?.premiumFrequency ?? 'ANNUAL');
  const [renewsOn, setRenewsOn] = useState(policy?.renewsOn ?? '');
  const [covers, setCovers] = useState(policy?.covers ?? '');
  const [loanId, setLoanId] = useState(policy?.loanId != null ? String(policy.loanId) : '');
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const loans = (loansPage?.content ?? []).filter((l) => l.status !== 'CLOSED');
  const busy = creating || updating || removing;

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Give this policy a name you’ll recognise.');
      return;
    }
    if (cover && !VALID_AMOUNT.test(cover)) {
      setError('Cover should be an amount, like 500000.');
      return;
    }
    if (premium && !VALID_AMOUNT.test(premium)) {
      setError('Premium should be an amount, like 47976.');
      return;
    }

    // Blank means "not recorded", and is sent as null rather than omitted, so clearing a
    // field on an edit actually clears it.
    const body = {
      type,
      name: name.trim(),
      insurer: insurer.trim() || null,
      policyLastFour: lastFour.trim() || null,
      coverAmount: cover || null,
      premium: premium || null,
      premiumFrequency: premium ? (frequency || null) : null,
      renewsOn: renewsOn || null,
      covers: covers.trim() || null,
      loanId: loanId ? Number(loanId) : null,
    };

    try {
      if (editing) {
        await update({ id: policy.id, body: { ...body, clearRenewsOn: !renewsOn, clearLoan: !loanId } }).unwrap();
      } else {
        await create(body).unwrap();
      }
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't save the policy.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${policy.name}` : 'Add cover'} footer={null}>
      <div className="flex flex-col gap-space-4">
        <div className="rounded-lg border border-line">
          <FormRow label="What">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              placeholder="Mom’s health cover, term life…"
              className={FORM_ROW_CONTROL}
              autoFocus
            />
          </FormRow>

          <FormRow label="Covers">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="What kind of cover this is"
              value={type}
              options={TYPES}
              onChange={(v) => setType(v as InsuranceType)}
            />
          </FormRow>

          <FormRow label="Who" hint="Optional. Whose cover this is - “Mom”, “me and Priya”.">
            <input
              value={covers}
              onChange={(e) => setCovers(e.target.value)}
              placeholder="Optional"
              className={FORM_ROW_CONTROL}
            />
          </FormRow>

          <FormRow label="Cover for" hint="What you'd get back. Never counted as money you have.">
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                inputMode="decimal"
                placeholder="Optional"
                className={FORM_ROW_CONTROL + ' num'}
              />
            </span>
          </FormRow>

          <FormRow label="Premium" hint="Leave blank if someone else pays it - an employer policy still has cover.">
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                inputMode="decimal"
                placeholder="Optional"
                className={FORM_ROW_CONTROL + ' num'}
              />
            </span>
          </FormRow>

          {premium && (
            <FormRow label="Paid">
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="How often the premium is paid"
                value={frequency}
                options={FREQUENCIES}
                onChange={(v) => setFrequency((v ?? '') as PremiumFrequency | '')}
              />
            </FormRow>
          )}

          <FormRow label="Renews on" hint="When cover lapses if nothing is done. The date that actually matters.">
            <input
              type="date"
              value={renewsOn}
              onChange={(e) => setRenewsOn(e.target.value)}
              className={FORM_ROW_CONTROL + ' num'}
            />
          </FormRow>

          <FormRow label="Insurer">
            <input
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              placeholder="Optional - HDFC Ergo, LIC…"
              className={FORM_ROW_CONTROL}
            />
          </FormRow>

          <FormRow label="Policy no." hint="Last four digits only. The full number is never stored.">
            <input
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="Optional"
              className={FORM_ROW_CONTROL + ' num'}
            />
          </FormRow>

          {loans.length > 0 && (
            <FormRow
              label="Paid off as"
              hint="If you financed this premium on a card in instalments, the loan that's repaying it. The debt stays a debt."
            >
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="The loan financing this premium"
                value={loanId}
                placeholder="Not financed"
                clearable
                options={loans.map((l) => ({ value: String(l.id), label: l.account.name }))}
                onChange={(v) => setLoanId(v ?? '')}
              />
            </FormRow>
          )}
        </div>

        <p className="text-caption text-ink-muted">
          Cover is what you wouldn’t have to find yourself. It’s never added to what you have.
        </p>

        {error && <p className="text-caption text-critical">{error}</p>}

        {confirmingDelete ? (
          <div className="flex flex-col gap-space-3 rounded-lg border border-line p-space-4">
            <p className="text-body text-ink">Delete {policy?.name}?</p>
            <p className="text-caption text-ink-muted">
              The record of being covered goes. Any loan repaying its premium stays — that debt is real either way.
            </p>
            <div className="flex gap-space-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  if (!policy) return;
                  await remove(policy.id).unwrap();
                  onClose();
                }}
              >
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-space-3">
            <Button variant="primary" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add cover'}
            </Button>
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
