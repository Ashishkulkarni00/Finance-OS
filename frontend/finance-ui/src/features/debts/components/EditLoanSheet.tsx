import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useGetAccountsQuery, useUpdateAccountMutation } from '@/services/accountService';
import { useUpdateLoanMutation } from '@/services/loanService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { todayLocalIso } from '@/lib/dates';
import { LoanStateFields } from './LoanStateFields';
import { firstEmiNotBeforeDisbursal, loanStateShape, nextEmiAfterAsOf } from './loanForm';
import type { LoanConfidence, LoanResponse, LoanStatus, RateType } from '@/types/loan';

const schema = z
  .object({
    name: z.string().min(1, 'What do you call this loan?').max(100),
    lender: z.string().min(1, "Who's the lender?").max(100),
    ...loanStateShape,
    rateType: z.enum(['FIXED', 'FLOATING']),
    confidence: z.enum(['CONFIRMED', 'ESTIMATED', 'TBD']),
    status: z.enum(['ACTIVE', 'UNCONFIRMED', 'SCHEDULED', 'CLOSED']),
    paidVia: z.enum(['BANK', 'CARD']),
    payFromAccountId: z.number().nullable(),
    note: z.string().max(500).optional(),
  })
  .refine(nextEmiAfterAsOf.check, nextEmiAfterAsOf.params)
  .refine(firstEmiNotBeforeDisbursal.check, firstEmiNotBeforeDisbursal.params);

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS: { value: LoanStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active - EMIs are running' },
  { value: 'SCHEDULED', label: 'Not started - first EMI still ahead' },
  { value: 'UNCONFIRMED', label: "Payment unverified - couldn't confirm an EMI left" },
  { value: 'CLOSED', label: 'Closed - fully repaid' },
];

function toFormValues(loan: LoanResponse): FormValues {
  return {
    name: loan.account.name,
    lender: loan.lender,
    principal: loan.principal ?? '',
    annualRate: loan.annualRate != null ? String(loan.annualRate) : '',
    tenureMonths: loan.tenureMonths != null ? String(loan.tenureMonths) : '',
    startDate: loan.startDate ?? '',
    originalFirstEmiDate: loan.originalFirstEmiDate ?? '',
    emi: loan.emi,
    outstanding: loan.outstandingBalance,
    balanceAsOf: loan.balanceAsOf,
    emisRemaining: String(loan.emisRemaining),
    firstEmiDate: loan.firstEmiDate,
    rateType: loan.rateType,
    confidence: loan.confidence,
    status: loan.status,
    paidVia: loan.paidVia,
    payFromAccountId: loan.payFromAccount?.id ?? null,
    note: loan.note ?? '',
  };
}

interface EditLoanSheetProps {
  loan: LoanResponse;
  open: boolean;
  onClose: () => void;
}

/**
 * "Edit loan" - every field. The stored values are the user's, so nothing is overwritten
 * on open; if the terms work out differently, LoanStateFields offers the calculated
 * values to use instead.
 *
 * <p>Confidence follows the rate: without one the loan is "Terms not supplied" whatever the
 * dropdown said. Removing a rate, or the paying account, is sent explicitly, because an
 * absent value already means "leave unchanged".
 */
export function EditLoanSheet({ loan, open, onClose }: EditLoanSheetProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [updateLoan, { isLoading: savingLoan }] = useUpdateLoanMutation();
  const [updateAccount, { isLoading: savingAccount }] = useUpdateAccountMutation();
  const today = todayLocalIso();

  const payFromAccounts =
    accountsPage?.content.filter((a) => !a.archived && (a.type === 'BANK' || a.type === 'CASH' || a.type === 'CREDIT_CARD')) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(loan),
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = form;

  const hasRate = !!watch('annualRate');

  const close = () => {
    onClose();
    reset(toFormValues(loan));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const name = values.name.trim();
      if (name !== loan.account.name) {
        await updateAccount({ id: loan.account.id, body: { name } }).unwrap();
      }

      const rate = values.annualRate?.trim();
      await updateLoan({
        id: loan.id,
        body: {
          lender: values.lender.trim(),
          outstandingBalance: values.outstanding,
          balanceAsOf: values.balanceAsOf,
          emisRemaining: Number(values.emisRemaining),
          firstEmiDate: values.firstEmiDate,
          emiDay: Number(values.firstEmiDate.slice(8, 10)),
          emi: values.emi,
          ...(values.principal?.trim() ? { principal: values.principal.trim() } : {}),
          ...(values.tenureMonths ? { tenureMonths: Number(values.tenureMonths) } : {}),
          ...(values.startDate ? { startDate: values.startDate } : {}),
          ...(values.originalFirstEmiDate ? { originalFirstEmiDate: values.originalFirstEmiDate } : {}),
          ...(rate
            ? { annualRate: Number(rate), confidence: values.confidence === 'TBD' ? 'ESTIMATED' : values.confidence }
            : loan.annualRate != null
              ? { clearAnnualRate: true }
              : { confidence: 'TBD' as LoanConfidence }),
          rateType: values.rateType,
          status: values.status,
          paidVia: values.paidVia,
          ...(values.payFromAccountId != null
            ? { payFromAccountId: values.payFromAccountId }
            : loan.payFromAccount
              ? { clearPayFromAccount: true }
              : {}),
          // "" clears a note server-side.
          note: values.note?.trim() ?? '',
        },
      }).unwrap();
      onClose();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      const field =
        appError.field === 'balanceAsOf' ||
        appError.field === 'firstEmiDate' ||
        appError.field === 'originalFirstEmiDate' ||
        appError.field === 'lender'
          ? appError.field
          : 'name';
      setError(field, { message: appError.message ?? "Couldn't save the loan." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Edit ${loan.account.name}`}
      footer={
        <Button type="submit" form="edit-loan" variant="primary" disabled={savingLoan || savingAccount} className="w-full">
          Save changes
        </Button>
      }
    >
      <form id="edit-loan" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <div className="rounded-lg border border-line">
          <FormRow label="Loan" error={errors.name?.message}>
            <input {...register('name')} autoComplete="off" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>
          <FormRow label="Lender" error={errors.lender?.message}>
            <input {...register('lender')} autoComplete="off" className={FORM_ROW_CONTROL} />
          </FormRow>
        </div>

        <LoanStateFields form={form} today={today} />

        <div className="rounded-lg border border-line">
          <FormRow label="Rate type">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Fixed or floating rate"
              value={watch('rateType')}
              options={[
                { value: 'FIXED', label: 'Fixed' },
                { value: 'FLOATING', label: 'Floating' },
              ]}
              onChange={(v) => setValue('rateType', v as RateType, { shouldValidate: true })}
            />
          </FormRow>

          <FormRow label="Terms from">
            {hasRate ? (
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="Where these terms come from"
                value={watch('confidence') === 'TBD' ? 'ESTIMATED' : watch('confidence')}
                options={[
                  { value: 'CONFIRMED', label: 'Confirmed - sanction letter or statement' },
                  { value: 'ESTIMATED', label: 'Estimated - from memory, close not exact' },
                ]}
                onChange={(v) => setValue('confidence', v as LoanConfidence, { shouldValidate: true })}
              />
            ) : (
              <span className="text-label text-ink-muted">Terms not supplied - add the rate to change this</span>
            )}
          </FormRow>

          <FormRow label="Status">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Loan status"
              value={watch('status')}
              options={STATUS_OPTIONS}
              onChange={(v) => setValue('status', v as LoanStatus, { shouldValidate: true })}
            />
          </FormRow>

          <FormRow label="Paid via">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Paid from a bank account or billed to a card"
              value={watch('paidVia')}
              options={[
                { value: 'BANK', label: 'Debited from a bank account' },
                { value: 'CARD', label: 'Billed to a card' },
              ]}
              onChange={(v) => {
                setValue('paidVia', v as 'BANK' | 'CARD', { shouldValidate: true });
                // A bank EMI leaves a bank account; a card EMI is charged to a card.
                setValue('payFromAccountId', null);
              }}
            />
          </FormRow>

          <FormRow label={watch('paidVia') === 'CARD' ? 'Card' : 'From'}>
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Account the EMI leaves from"
              value={watch('payFromAccountId') ? String(watch('payFromAccountId')) : ''}
              placeholder="Not recorded"
              clearable
              options={payFromAccounts
                .filter((a) => (watch('paidVia') === 'CARD') === (a.type === 'CREDIT_CARD'))
                .map((a) => ({ value: String(a.id), label: a.name }))}
              onChange={(v) => setValue('payFromAccountId', v ? Number(v) : null)}
            />
          </FormRow>

          <FormRow label="Note">
            <input {...register('note')} autoComplete="off" placeholder="Optional" className={FORM_ROW_CONTROL} />
          </FormRow>
        </div>
      </form>
    </Modal>
  );
}
