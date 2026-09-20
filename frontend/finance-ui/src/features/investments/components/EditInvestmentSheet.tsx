import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { useGetAccountsQuery } from '@/services/accountService';
import { useUpdateInvestmentMutation } from '@/services/investmentService';
import type { InvestmentResponse, InvestmentType } from '@/types/investment';

const TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'MUTUAL_FUND_SIP', label: 'Mutual fund - SIP' },
  { value: 'MUTUAL_FUND_LUMPSUM', label: 'Mutual fund - lump sum' },
  { value: 'RECURRING_DEPOSIT', label: 'Recurring deposit' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed deposit' },
  { value: 'EPF', label: 'EPF' },
  { value: 'PPF', label: 'PPF' },
  { value: 'NPS', label: 'NPS' },
  { value: 'STOCKS', label: 'Stocks' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'OTHER', label: 'Something else' },
];

const AMOUNT = /^\d+(\.\d{1,2})?$/;

const schema = z.object({
  name: z.string().min(1, 'What do you call this holding?').max(100),
  type: z.enum(TYPES.map((t) => t.value) as [InvestmentType, ...InvestmentType[]]),
  monthlyContribution: z
    .string()
    .optional()
    .refine((v) => !v || AMOUNT.test(v), 'Enter a valid amount'),
  contributionDay: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 1 && Number(v) <= 31), 'Pick a day between 1 and 31'),
  payFromAccountId: z.number().nullable(),
  statedInvested: z
    .string()
    .optional()
    .refine((v) => !v || AMOUNT.test(v), 'Enter a valid amount'),
  liquid: z.boolean(),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

/**
 * "Edit holding" - correcting what a holding is, rather than what it's worth.
 *
 * <p>Deliberately not the add form: adding also creates the investment account behind a
 * ledger-tracked holding, and whether a holding is tracked in the ledger can't be changed
 * afterwards. This edits only what `PATCH /investments/{id}` actually accepts - the API has
 * always allowed it, with nothing calling it.
 *
 * <p>"Already in" is offered only for a holding kept outside the ledger. With an account,
 * what's gone in is the account's own balance from real entries, so a hand-typed figure
 * would be a second, competing truth.
 */
export function EditInvestmentSheet({ investment, open, onClose }: { investment: InvestmentResponse; open: boolean; onClose: () => void }) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [updateInvestment, { isLoading }] = useUpdateInvestmentMutation();
  const accounts = (accountsPage?.content ?? []).filter(
    (a) => (!a.archived && (a.type === 'BANK' || a.type === 'CASH')) || a.id === investment.payFromAccount?.id,
  );

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: investment.name,
      type: investment.type,
      monthlyContribution: investment.monthlyContribution ?? '',
      contributionDay: investment.contributionDay ? String(investment.contributionDay) : '',
      payFromAccountId: investment.payFromAccount?.id ?? null,
      statedInvested: investment.outsideLedger ? (investment.openingInvested ?? '') : '',
      liquid: investment.liquid,
      note: investment.note ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateInvestment({
        id: investment.id,
        body: {
          name: values.name.trim(),
          type: values.type,
          ...(values.payFromAccountId != null ? { payFromAccountId: values.payFromAccountId } : {}),
          ...(values.monthlyContribution ? { monthlyContribution: values.monthlyContribution } : {}),
          ...(values.contributionDay ? { contributionDay: Number(values.contributionDay) } : {}),
          ...(investment.outsideLedger && values.statedInvested ? { statedInvested: values.statedInvested } : {}),
          liquid: values.liquid,
          note: values.note?.trim() ?? '',
        },
      }).unwrap();
      onClose();
    } catch (err) {
      const appError = err as { message?: string };
      setError('name', { message: appError.message ?? "Couldn't save that holding." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${investment.name}`}
      footer={
        <Button type="submit" form="edit-investment" variant="primary" disabled={isLoading} className="w-full">
          Save changes
        </Button>
      }
    >
      <form id="edit-investment" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <div className="rounded-lg border border-line">
          <FormRow label="Name" error={errors.name?.message}>
            <input {...register('name')} autoComplete="off" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <FormRow label="Kind">
                <Select
                  variant="row"
                  className="-ml-space-1 max-w-full"
                  ariaLabel="What kind of holding this is"
                  value={field.value}
                  options={TYPES}
                  onChange={(v) => v && field.onChange(v as InvestmentType)}
                />
              </FormRow>
            )}
          />

          <FormRow label="Monthly" error={errors.monthlyContribution?.message} hint="What goes in each month, if it's a SIP or an RD. Leave it empty for a one-off holding.">
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input {...register('monthlyContribution')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
            </span>
          </FormRow>

          <FormRow label="On day" error={errors.contributionDay?.message} hint="The day of the month it goes in.">
            <input {...register('contributionDay')} inputMode="numeric" placeholder="5" className="num w-12 bg-transparent text-label text-ink outline-none" />
          </FormRow>

          <Controller
            control={control}
            name="payFromAccountId"
            render={({ field }) => (
              <FormRow label="Paid from" hint="The account the money leaves. Leave it empty for something your employer deducts.">
                <Select
                  variant="row"
                  className="-ml-space-1 max-w-full"
                  ariaLabel="Account the contribution leaves from"
                  value={field.value ? String(field.value) : ''}
                  placeholder="Nothing of mine pays it"
                  clearable
                  options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                  onChange={(v) => field.onChange(v ? Number(v) : null)}
                />
              </FormRow>
            )}
          />

          {investment.outsideLedger && (
            <FormRow
              label="Already in"
              error={errors.statedInvested?.message}
              hint="What has gone in so far. Yours to state, because this one isn't tracked entry by entry."
            >
              <span className="flex items-center gap-space-1">
                <span className="num text-ink-muted">₹</span>
                <input {...register('statedInvested')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
              </span>
            </FormRow>
          )}

          <Controller
            control={control}
            name="liquid"
            render={({ field }) => (
              <FormRow label="Can reach it?" hint="No for something locked away - PPF, EPF, an FD with a penalty. Those are kept out of what's counted as safe to reach.">
                <Select
                  variant="row"
                  className="-ml-space-1 max-w-full"
                  ariaLabel="Whether this can be reached if needed"
                  value={field.value ? 'yes' : 'no'}
                  options={[
                    { value: 'yes', label: 'Yes - I could take it out' },
                    { value: 'no', label: 'No - locked away' },
                  ]}
                  onChange={(v) => field.onChange(v === 'yes')}
                />
              </FormRow>
            )}
          />

          <FormRow label="Note">
            <input {...register('note')} placeholder="Optional" className={FORM_ROW_CONTROL} />
          </FormRow>
        </div>

        <p className="text-caption text-ink-muted">
          What it’s worth is recorded on the holding itself, not here.
          {investment.outsideLedger
            ? ''
            : ' What has gone in comes from its own entries, so it isn’t typed in either.'}
        </p>
      </form>
    </Modal>
  );
}
