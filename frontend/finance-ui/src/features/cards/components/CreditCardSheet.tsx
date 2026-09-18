import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useGetAccountsQuery } from '@/services/accountService';
import { useCreateCreditCardMutation, useUpdateCreditCardMutation } from '@/services/cardService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { todayLocalIso } from '@/lib/dates';
import { CARD_NETWORKS, ordinal } from '../cardFormat';
import type { CardNetwork, CreditCardResponse } from '@/types/card';

const MONEY = /^\d+(\.\d{1,2})?$/;
const dayField = (question: string) =>
  z
    .string()
    .min(1, question)
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 28, 'A day from 1 to 28');

const schema = z.object({
  name: z.string().trim().min(1, 'What do you call this card?').max(100),
  institution: z.string().max(100).optional(),
  lastFour: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), 'Only the last 4 digits'),
  network: z.string().optional(),
  creditLimit: z
    .string()
    .min(1, "What's the credit limit?")
    .refine((v) => MONEY.test(v) && Number(v) > 0, 'Enter a valid amount'),
  statementDay: dayField('Which day is the statement generated?'),
  dueDay: dayField('Which day is the bill due?'),
  payFromAccountId: z.number().nullable(),
  outstanding: z
    .string()
    .optional()
    .refine((v) => !v || MONEY.test(v), 'Enter a valid amount'),
  outstandingAsOf: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function initialValues(card?: CreditCardResponse | null): FormValues {
  return {
    name: card?.name ?? '',
    institution: card?.institution ?? '',
    lastFour: card?.lastFour ?? '',
    network: card?.network ?? '',
    creditLimit: card?.creditLimit ?? '',
    statementDay: card?.statementDay != null ? String(card.statementDay) : '',
    dueDay: card?.dueDay != null ? String(card.dueDay) : '',
    payFromAccountId: card?.payFromAccount?.id ?? null,
    outstanding: '',
    outstandingAsOf: todayLocalIso(),
  };
}

const SERVER_FIELDS = ['name', 'lastFour', 'creditLimit', 'statementDay', 'dueDay', 'payFromAccountId', 'outstanding', 'outstandingAsOf'] as const;

interface CreditCardSheetProps {
  open: boolean;
  onClose: () => void;
  /** Edit this card. Omit to add one. A card without terms is finished setting up here. */
  card?: CreditCardResponse | null;
}

/**
 * "Add a credit card" / "Edit card". One save creates the card's own account and its
 * terms together, so a card never exists without its limit and statement cycle.
 *
 * <p>A credit card isn't linked to a bank account - "Paid from" only pre-fills Pay bill.
 */
export function CreditCardSheet({ open, onClose, card }: CreditCardSheetProps) {
  const editing = !!card;
  const { data: accountsPage } = useGetAccountsQuery();
  const [createCard, { isLoading: creating }] = useCreateCreditCardMutation();
  const [updateCard, { isLoading: updating }] = useUpdateCreditCardMutation();
  const today = todayLocalIso();

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
    defaultValues: initialValues(card),
  });

  const close = () => {
    onClose();
    reset(initialValues(card));
  };

  const statementDay = Number(watch('statementDay'));
  const dueDay = Number(watch('dueDay'));
  const daysValid = [statementDay, dueDay].every((d) => Number.isInteger(d) && d >= 1 && d <= 28);

  const onSubmit = async (values: FormValues) => {
    const network = (values.network || null) as CardNetwork | null;
    try {
      if (card) {
        await updateCard({
          accountId: card.accountId,
          body: {
            name: values.name.trim(),
            institution: values.institution?.trim() ?? '',
            ...(values.lastFour ? { lastFour: values.lastFour } : {}),
            ...(network ? { network } : {}),
            creditLimit: values.creditLimit,
            statementDay,
            dueDay,
            ...(values.payFromAccountId != null
              ? { payFromAccountId: values.payFromAccountId }
              : card.payFromAccount
                ? { clearPayFromAccount: true }
                : {}),
          },
        }).unwrap();
      } else {
        await createCard({
          name: values.name.trim(),
          institution: values.institution?.trim() || null,
          lastFour: values.lastFour || null,
          network,
          creditLimit: values.creditLimit,
          statementDay,
          dueDay,
          payFromAccountId: values.payFromAccountId,
          outstanding: values.outstanding || '0',
          outstandingAsOf: values.outstandingAsOf || today,
        }).unwrap();
      }
      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      const serverField = appError.field === 'openingAsOf' ? 'outstandingAsOf' : appError.field;
      const field = SERVER_FIELDS.find((f) => f === serverField) ?? 'name';
      setError(field, { message: appError.message ?? "Couldn't save the card." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={card ? `Edit ${card.name}` : 'Add a credit card'}
      footer={
        <Button type="submit" form="credit-card" variant="primary" disabled={creating || updating} className="w-full">
          {editing ? 'Save changes' : 'Save'}
        </Button>
      }
    >
      <form id="credit-card" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <p className="text-caption text-ink-soft">
          A credit card is its own account, not linked to a bank. What you spend on it is owed until you pay the bill.
        </p>

        <div className="rounded-lg border border-line">
          <FormRow label="Card" error={errors.name?.message} hint="A name you’ll recognise, like HDFC Millennia.">
            <input {...register('name')} autoComplete="off" placeholder="HDFC Millennia" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>
          <FormRow label="Bank" hint="The bank that issued the card.">
            <input {...register('institution')} autoComplete="off" placeholder="Optional" className={FORM_ROW_CONTROL} />
          </FormRow>
          <FormRow label="Last 4" error={errors.lastFour?.message} hint="Only the last 4 digits printed on the card, never the full number.">
            <input {...register('lastFour')} inputMode="numeric" maxLength={4} placeholder="Optional" className={FORM_ROW_CONTROL + ' num'} />
          </FormRow>
          <FormRow label="Network" hint="The scheme printed on the card, like Visa or RuPay.">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Card network"
              value={watch('network') ?? ''}
              placeholder="Optional"
              clearable
              options={CARD_NETWORKS}
              onChange={(v) => setValue('network', v)}
            />
          </FormRow>
        </div>

        <div>
          <p className="mb-space-2 text-micro uppercase tracking-[0.08em] text-ink-muted">Limit and bill</p>
          <div className="rounded-lg border border-line">
            <FormRow label="Credit limit" error={errors.creditLimit?.message} hint="The total limit shown in your card app or on the statement.">
              <span className="flex items-center gap-space-1">
                <span className="num text-ink-muted">₹</span>
                <input {...register('creditLimit')} inputMode="decimal" placeholder="100000" className={FORM_ROW_CONTROL + ' num'} />
              </span>
            </FormRow>
            <FormRow label="Statement" error={errors.statementDay?.message} hint="The day of the month your statement is generated.">
              <span className="flex items-center gap-space-2">
                <input {...register('statementDay')} inputMode="numeric" placeholder="15" className="w-12 bg-transparent text-label text-ink outline-none num" />
                <span className="text-caption text-ink-muted">of every month</span>
              </span>
            </FormRow>
            <FormRow label="Bill due" error={errors.dueDay?.message} hint="The day of the month the bill must be paid by.">
              <span className="flex items-center gap-space-2">
                <input {...register('dueDay')} inputMode="numeric" placeholder="5" className="w-12 bg-transparent text-label text-ink outline-none num" />
                <span className="text-caption text-ink-muted">of the month</span>
              </span>
            </FormRow>
            <FormRow label="Paid from" hint="The bank account you usually pay this bill from; it only fills in Pay bill.">
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="Account the bill is usually paid from"
                value={watch('payFromAccountId') ? String(watch('payFromAccountId')) : ''}
                placeholder="Not set"
                clearable
                options={payFromAccounts.map((a) => ({ value: String(a.id), label: a.name }))}
                onChange={(v) => setValue('payFromAccountId', v ? Number(v) : null)}
              />
            </FormRow>
          </div>
          {daysValid && (
            <p className="mt-space-2 text-caption text-ink-muted">
              Statement on the {ordinal(statementDay)} of each month, bill due the {ordinal(dueDay)}{' '}
              {dueDay > statementDay ? 'of the same month' : 'of the following month'}.
            </p>
          )}
        </div>

        {!editing && (
          <div>
            <p className="mb-space-2 text-micro uppercase tracking-[0.08em] text-ink-muted">Where it stands</p>
            <div className="rounded-lg border border-line">
              <FormRow label="Owed today" error={errors.outstanding?.message} hint="Everything owed on the card right now, billed and unbilled, from your card app.">
                <span className="flex items-center gap-space-1">
                  <span className="num text-ink-muted">₹</span>
                  <input {...register('outstanding')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
                </span>
              </FormRow>
              <FormRow label="As of" error={errors.outstandingAsOf?.message} hint="The date that owed amount is from.">
                <input type="date" {...register('outstandingAsOf')} max={today} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
              </FormRow>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
