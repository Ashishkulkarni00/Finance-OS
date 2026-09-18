import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useCreateAccountMutation, useGetAccountsQuery } from '@/services/accountService';
import { useCreateLoanMutation } from '@/services/loanService';
import { useCreateBillFromLoanMutation } from '@/services/commitmentRuleService';
import { useState } from 'react';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { todayLocalIso } from '@/lib/dates';
import { LoanStateFields } from './LoanStateFields';
import { firstEmiNotBeforeDisbursal, loanStateShape, nextEmiAfterAsOf } from './loanForm';

const schema = z
  .object({
    name: z.string().min(1, 'What do you call this loan?').max(100),
    lender: z.string().min(1, "Who's the lender?").max(100),
    ...loanStateShape,
    paidVia: z.enum(['BANK', 'CARD']),
    payFromAccountId: z.number().nullable(),
    note: z.string().max(500).optional(),
  })
  .refine(nextEmiAfterAsOf.check, nextEmiAfterAsOf.params)
  .refine(firstEmiNotBeforeDisbursal.check, firstEmiNotBeforeDisbursal.params);

type FormValues = z.infer<typeof schema>;

interface AddLoanSheetProps {
  open: boolean;
  onClose: () => void;
}

function defaults(): FormValues {
  return {
    name: '',
    lender: '',
    principal: '',
    annualRate: '',
    tenureMonths: '',
    startDate: '',
    originalFirstEmiDate: '',
    emi: '',
    outstanding: '',
    balanceAsOf: todayLocalIso(),
    emisRemaining: '',
    firstEmiDate: '',
    paidVia: 'BANK',
    payFromAccountId: null,
    note: '',
  };
}

/**
 * "Add a loan" - the terms from the sanction letter, then where the loan stands today,
 * worked out from them (LoanStateFields).
 *
 * <p>Creates two records from one form: the LOAN account holding the liability - opened at
 * the outstanding principal on its date - and the loan against it.
 */
export function AddLoanSheet({ open, onClose }: AddLoanSheetProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [createAccount] = useCreateAccountMutation();
  const [createLoan, { isLoading }] = useCreateLoanMutation();
  const [createBillFromLoan] = useCreateBillFromLoanMutation();
  const [addToPlan, setAddToPlan] = useState(true);
  const today = todayLocalIso();

  const payFromAccounts = accountsPage?.content.filter((a) => !a.archived && (a.type === 'BANK' || a.type === 'CASH' || a.type === 'CREDIT_CARD')) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
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

  const close = () => {
    onClose();
    reset(defaults());
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const rate = values.annualRate?.trim();
      const account = await createAccount({
        name: values.name.trim(),
        type: 'LOAN',
        institution: values.lender.trim(),
        // The outstanding principal on the date it's true for - the liability's own balance.
        openingBalance: `-${values.outstanding}`,
        openingAsOf: values.balanceAsOf,
        openingConfidence: rate ? 'ESTIMATED' : 'UNKNOWN',
        purpose: values.note?.trim() || null,
      }).unwrap();

      const loan = await createLoan({
        accountId: account.id,
        lender: values.lender.trim(),
        outstandingBalance: values.outstanding,
        balanceAsOf: values.balanceAsOf,
        emisRemaining: Number(values.emisRemaining),
        firstEmiDate: values.firstEmiDate,
        emiDay: Number(values.firstEmiDate.slice(8, 10)),
        emi: values.emi,
        annualRate: rate ? Number(rate) : null,
        principal: values.principal?.trim() || null,
        tenureMonths: values.tenureMonths ? Number(values.tenureMonths) : null,
        startDate: values.startDate || null,
        originalFirstEmiDate: values.originalFirstEmiDate || null,
        paidVia: values.paidVia,
        payFromAccountId: values.payFromAccountId,
        note: values.note?.trim() || null,
      }).unwrap();

      // The EMI goes into the plan as a bill that follows the loan - entered once.
      if (addToPlan && values.payFromAccountId) {
        await createBillFromLoan(loan.id).unwrap();
      }

      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      const field =
        appError.field === 'balanceAsOf' || appError.field === 'firstEmiDate' || appError.field === 'originalFirstEmiDate'
          ? appError.field
          : 'name';
      setError(field, { message: appError.message ?? "Couldn't save that loan." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a loan"
      footer={
        <Button type="submit" form="add-loan" variant="primary" disabled={isLoading} className="w-full">
          Save
        </Button>
      }
    >
      <form id="add-loan" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <div className="rounded-lg border border-line">
          <FormRow label="Loan" error={errors.name?.message}>
            <input {...register('name')} autoComplete="off" placeholder="Bike loan, education loan…" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>
          <FormRow label="Lender" error={errors.lender?.message}>
            <input {...register('lender')} autoComplete="off" placeholder="HDFC, SBI, Bajaj…" className={FORM_ROW_CONTROL} />
          </FormRow>
        </div>

        <LoanStateFields form={form} today={today} />

        <div className="rounded-lg border border-line">
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

          <FormRow label="In the plan" hint="Adds the EMI to Months as a bill that follows this loan, so what's free already allows for it.">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Add the EMI to the plan"
              value={addToPlan ? 'yes' : 'no'}
              options={[
                { value: 'yes', label: watch('payFromAccountId') ? 'Yes - add its EMI as a bill' : 'Yes, once the account above is chosen' },
                { value: 'no', label: 'No - I already have a bill for it' },
              ]}
              onChange={(v) => setAddToPlan(v === 'yes')}
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
