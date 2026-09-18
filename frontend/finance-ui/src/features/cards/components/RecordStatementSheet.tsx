import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useAddCardStatementMutation, useGetStatementDraftQuery } from '@/services/cardService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { todayLocalIso } from '@/lib/dates';
import type { CreditCardResponse } from '@/types/card';

const MONEY = /^\d+(\.\d{1,2})?$/;

const schema = z
  .object({
    statementDate: z.string().min(1, 'Which date is the statement for?'),
    dueDate: z.string().min(1, 'When is the bill due?'),
    totalAmount: z.string().min(1, "What's the total due?").regex(MONEY, 'Enter a valid amount'),
    minimumDue: z.string().min(1, "What's the minimum due?").regex(MONEY, 'Enter a valid amount'),
  })
  // ISO dates compare correctly as text.
  .refine((v) => !v.statementDate || !v.dueDate || v.dueDate >= v.statementDate, {
    message: 'The due date can’t be before the statement date',
    path: ['dueDate'],
  })
  // A comparison, not arithmetic.
  .refine((v) => !MONEY.test(v.totalAmount) || !MONEY.test(v.minimumDue) || Number(v.minimumDue) <= Number(v.totalAmount), {
    message: 'The minimum due can’t be more than the total',
    path: ['minimumDue'],
  });

type FormValues = z.infer<typeof schema>;

const FIELDS = ['statementDate', 'dueDate', 'totalAmount', 'minimumDue'] as const;

interface RecordStatementSheetProps {
  card: CreditCardResponse;
  open: boolean;
  onClose: () => void;
}

/**
 * "Record statement" - the bank's figures, with everything that can be worked out already
 * filled in: the latest statement date from the card's statement day, its due date from
 * the due day, and the total from the entries on this card up to that date (server-side).
 * Each is replaced if the user types their own; the bank's printed figure always wins.
 */
export function RecordStatementSheet({ card, open, onClose }: RecordStatementSheetProps) {
  const today = todayLocalIso();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { statementDate: '', dueDate: '', totalAmount: '', minimumDue: '' },
  });

  const chosenDate = watch('statementDate');
  const { data: draft } = useGetStatementDraftQuery(
    { accountId: card.accountId, statementDate: chosenDate || undefined },
    { skip: !open },
  );
  const [addStatement, { isLoading }] = useAddCardStatementMutation();

  useEffect(() => {
    if (!draft) return;
    if (!getValues('statementDate')) setValue('statementDate', draft.statementDate);
    if (!dirtyFields.dueDate) setValue('dueDate', draft.dueDate);
    if (!dirtyFields.totalAmount) setValue('totalAmount', draft.totalFromLedger ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const close = () => {
    onClose();
    reset();
  };

  const fromEntries = draft?.totalFromLedger != null && !dirtyFields.totalAmount && watch('totalAmount') === draft.totalFromLedger;

  const onSubmit = async (values: FormValues) => {
    try {
      await addStatement({ accountId: card.accountId, body: values }).unwrap();
      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      const field = FIELDS.find((f) => f === appError.field) ?? 'totalAmount';
      setError(field, { message: appError.message ?? "Couldn't save the statement." });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Record ${card.name} statement`}
      footer={
        <Button type="submit" form="record-statement" variant="primary" disabled={isLoading} className="w-full">
          Save
        </Button>
      }
    >
      <form id="record-statement" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <div className="rounded-lg border border-line">
          <FormRow label="Statement" error={errors.statementDate?.message} hint="The statement or billing date printed on the statement.">
            <input type="date" {...register('statementDate')} max={today} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
          </FormRow>
          <FormRow label="Due by" error={errors.dueDate?.message} hint="The payment due date on the statement, filled in from the card’s due day.">
            <input type="date" {...register('dueDate')} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
          </FormRow>
          <FormRow label="Total due" error={errors.totalAmount?.message} hint="The total amount due on the statement, filled in from what you’ve entered on this card.">
            <span className="flex items-center gap-space-2">
              <span className="num text-ink-muted">₹</span>
              <input {...register('totalAmount')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
              {fromEntries && (
                <span className="shrink-0 rounded-sm bg-sunken px-space-1 text-micro text-ink-muted">from your entries</span>
              )}
            </span>
          </FormRow>
          <FormRow label="Minimum" error={errors.minimumDue?.message} hint="The minimum amount due printed on the statement.">
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input {...register('minimumDue')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
            </span>
          </FormRow>
        </div>

        {draft?.alreadyRecorded && (
          <p className="text-caption text-attention">
            A statement for this date is already recorded. Delete it from the card’s statements to enter it again.
          </p>
        )}
        {draft && draft.totalFromLedger == null ? (
          <p className="text-caption text-ink-muted">
            This card is tracked from a later date, so the total can’t be worked out. Copy it from the statement.
          </p>
        ) : (
          <p className="text-caption text-ink-muted">
            If the bank’s total is different, use the bank’s figure. The difference usually means a spend on this card isn’t in your
            Ledger yet.
          </p>
        )}
      </form>
    </Modal>
  );
}
