import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useCreateAccountMutation, useGetAccountsQuery } from '@/services/accountService';
import { useCreateInvestmentMutation } from '@/services/investmentService';
import type { InvestmentType } from '@/types/investment';
import { handleEnterAdvance } from '@/lib/formKeyboard';

const TYPE_OPTIONS: { value: InvestmentType; label: string }[] = [
  { value: 'MUTUAL_FUND_SIP', label: 'Mutual fund SIP' },
  { value: 'MUTUAL_FUND_LUMPSUM', label: 'Mutual fund' },
  { value: 'RECURRING_DEPOSIT', label: 'Recurring deposit' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed deposit' },
  { value: 'EPF', label: 'Provident fund' },
  { value: 'PPF', label: 'PPF' },
  { value: 'NPS', label: 'NPS' },
  { value: 'STOCKS', label: 'Stocks' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'OTHER', label: 'Other' },
];

const schema = z
  .object({
    name: z.string().min(1, 'What do you call this holding?').max(100),
    type: z.enum([
      'MUTUAL_FUND_SIP',
      'MUTUAL_FUND_LUMPSUM',
      'RECURRING_DEPOSIT',
      'FIXED_DEPOSIT',
      'EPF',
      'PPF',
      'NPS',
      'STOCKS',
      'GOLD',
      'OTHER',
    ]),
    /** 'ledger' creates an INVESTMENT account; 'outside' records a stated figure only. */
    tracking: z.enum(['ledger', 'outside']),
    alreadyIn: z
      .string()
      .min(1, "How much has gone in so far?")
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
    monthlyContribution: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount'),
    contributionDay: z
      .string()
      .optional()
      .refine((v) => !v || (Number(v) >= 1 && Number(v) <= 31), 'Pick a day between 1 and 31'),
    payFromAccountId: z.number().nullable(),
    currentValue: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount'),
    liquid: z.boolean(),
    note: z.string().max(500).optional(),
  });

type FormValues = z.infer<typeof schema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddInvestmentSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Add a holding" - the entry point the Investments tab never had; every holding in the
 * product had to be created against the API by hand (DATA_ENTRY_AUDIT.md §5).
 *
 * <p>Two shapes of holding, and the difference is structural rather than cosmetic.
 * Most have a ledger account - a SIP into Zerodha, an RD - and for those the account's
 * own balance is the truth about how much has gone in, fed by real postings. Some have
 * none at all: a provident fund the employer deducts at source never touches an account
 * we track. The form asks which, then creates an INVESTMENT account for the first kind
 * and records a stated figure for the second.
 *
 * <p>Current value stays optional throughout - the source workbook's rule, quoted in
 * `Investment.java`: leave it blank and the register says so rather than guessing.
 */
export function AddInvestmentSheet({ open, onClose }: AddInvestmentSheetProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [createAccount] = useCreateAccountMutation();
  const [createInvestment, { isLoading }] = useCreateInvestmentMutation();

  const payFromAccounts = accountsPage?.content.filter((a) => !a.archived && (a.type === 'BANK' || a.type === 'CASH')) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'MUTUAL_FUND_SIP',
      tracking: 'ledger',
      alreadyIn: '',
      monthlyContribution: '',
      contributionDay: '',
      payFromAccountId: null,
      currentValue: '',
      liquid: true,
      note: '',
    },
  });

  const tracking = watch('tracking');

  const close = () => {
    onClose();
    reset();
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let accountId: number | null = null;

      if (values.tracking === 'ledger') {
        // The account's opening balance is what had gone in before tracking began;
        // everything after that arrives as real INVESTMENT transactions.
        const account = await createAccount({
          name: values.name.trim(),
          type: 'INVESTMENT',
          openingBalance: values.alreadyIn,
          openingAsOf: todayIso(),
          openingConfidence: 'ESTIMATED',
          includeInSpendable: false,
          purpose: values.note?.trim() || null,
        }).unwrap();
        accountId = account.id;
      }

      await createInvestment({
        name: values.name.trim(),
        type: values.type,
        accountId,
        payFromAccountId: values.payFromAccountId,
        monthlyContribution: values.monthlyContribution || null,
        contributionDay: values.contributionDay ? Number(values.contributionDay) : null,
        // Only meaningful without an account - otherwise the account balance is the truth.
        statedInvested: values.tracking === 'outside' ? values.alreadyIn : null,
        currentValue: values.currentValue || null,
        liquid: values.liquid,
        note: values.note?.trim() || null,
      }).unwrap();

      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      setError('name', { message: appError.message ?? "Couldn't save that holding." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a holding"
      footer={
        <Button type="submit" form="add-investment" variant="primary" disabled={isLoading} className="w-full">
          Save
        </Button>
      }
    >
      <form id="add-investment" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <div className="rounded-lg border border-line">
          <FormRow label="Name" error={errors.name?.message}>
            <input {...register('name')} autoComplete="off" placeholder="SIP - Zerodha, Provident fund…" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>

          <FormRow label="Kind">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="What kind of investment"
              value={watch('type')}
              options={TYPE_OPTIONS}
              onChange={(v) => setValue('type', v as InvestmentType, { shouldValidate: true })}
            />
          </FormRow>

          <FormRow label="Tracked">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="How this holding is tracked"
              value={tracking}
              options={[
                { value: 'ledger', label: 'As an account I pay into' },
                { value: 'outside', label: "Outside the ledger - I'll state the figure" },
              ]}
              onChange={(v) => setValue('tracking', v as 'ledger' | 'outside', { shouldValidate: true })}
            />
          </FormRow>

          <FormRow label="Put in so far" error={errors.alreadyIn?.message}>
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input {...register('alreadyIn')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
            </span>
          </FormRow>

          <FormRow label="Monthly" error={errors.monthlyContribution?.message}>
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input
                {...register('monthlyContribution')}
                inputMode="decimal"
                placeholder="Optional - if you add to it regularly"
                className={FORM_ROW_CONTROL + ' num'}
              />
            </span>
          </FormRow>

          {watch('monthlyContribution') && (
            <FormRow label="On the" error={errors.contributionDay?.message}>
              <span className="flex items-center gap-space-2">
                <input {...register('contributionDay')} inputMode="numeric" placeholder="13" className="w-12 bg-transparent text-label text-ink outline-none num" />
                <span className="text-caption text-ink-muted">of each month</span>
              </span>
            </FormRow>
          )}

          <FormRow label="Paid from">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Account the contribution comes from"
              value={watch('payFromAccountId') ? String(watch('payFromAccountId')) : ''}
              placeholder={tracking === 'outside' ? 'Nothing of mine - employer deducts it' : 'Not recorded'}
              clearable
              options={payFromAccounts.map((a) => ({ value: String(a.id), label: a.name }))}
              onChange={(v) => setValue('payFromAccountId', v ? Number(v) : null)}
            />
          </FormRow>

          <FormRow label="Worth today" error={errors.currentValue?.message}>
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input
                {...register('currentValue')}
                inputMode="decimal"
                placeholder="Optional - leave blank if you haven't checked"
                className={FORM_ROW_CONTROL + ' num'}
              />
            </span>
          </FormRow>

          <FormRow label="Reachable?">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Whether this could be turned into money if needed"
              value={watch('liquid') ? 'yes' : 'no'}
              options={[
                { value: 'yes', label: 'Yes - I could get at it if I needed to' },
                { value: 'no', label: "No - locked away (a provident fund, a locked-in deposit)" },
              ]}
              onChange={(v) => setValue('liquid', v === 'yes', { shouldValidate: true })}
            />
          </FormRow>

          <FormRow label="Note">
            <input {...register('note')} autoComplete="off" placeholder="Optional" className={FORM_ROW_CONTROL} />
          </FormRow>
        </div>

        <p className="text-caption text-ink-muted">
          Haven't checked what it's worth lately? Leave it blank. Kosh tracks what you've put in either way, and
          shows a gain only once you've told it a real value - never an estimated one.
        </p>
      </form>
    </Modal>
  );
}
