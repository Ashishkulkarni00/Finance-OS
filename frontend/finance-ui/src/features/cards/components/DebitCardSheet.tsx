import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useGetAccountsQuery } from '@/services/accountService';
import { useCreateDebitCardMutation, useDeleteDebitCardMutation, useUpdateDebitCardMutation } from '@/services/cardService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { CARD_NETWORKS } from '../cardFormat';
import type { CardNetwork, DebitCardResponse } from '@/types/card';

const schema = z.object({
  name: z.string().trim().min(1, 'What do you call this card?').max(100),
  accountId: z.number({ error: 'Which bank account does it spend from?' }),
  network: z.string().optional(),
  lastFour: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), 'Only the last 4 digits'),
});

type FormValues = z.infer<typeof schema>;

interface DebitCardSheetProps {
  open: boolean;
  onClose: () => void;
  /** Edit this card. Omit to add one. */
  card?: DebitCardResponse | null;
  /** The bank account to start with when adding from that account's page. */
  defaultAccountId?: number;
}

/**
 * "Add a debit card" / "Edit debit card". A debit card belongs to one bank account and has
 * no balance of its own - what's spent with it is an expense from that account.
 */
export function DebitCardSheet({ open, onClose, card, defaultAccountId }: DebitCardSheetProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [createCard, { isLoading: creating }] = useCreateDebitCardMutation();
  const [updateCard, { isLoading: updating }] = useUpdateDebitCardMutation();
  const [deleteCard, { isLoading: deleting }] = useDeleteDebitCardMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const banks = accountsPage?.content.filter((a) => a.type === 'BANK' && (!a.archived || a.id === card?.account.id)) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: card?.name ?? '',
      accountId: card?.account.id ?? defaultAccountId ?? (undefined as unknown as number),
      network: card?.network ?? '',
      lastFour: card?.lastFour ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const network = (values.network || null) as CardNetwork | null;
    try {
      if (card) {
        await updateCard({
          id: card.id,
          body: {
            name: values.name.trim(),
            accountId: values.accountId,
            ...(network ? { network } : card.network ? { clearNetwork: true } : {}),
            ...(values.lastFour ? { lastFour: values.lastFour } : card.lastFour ? { clearLastFour: true } : {}),
          },
        }).unwrap();
      } else {
        await createCard({ name: values.name.trim(), accountId: values.accountId, network, lastFour: values.lastFour || null }).unwrap();
      }
      onClose();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      setError(appError.field === 'accountId' || appError.field === 'lastFour' ? appError.field : 'name', {
        message: appError.message ?? "Couldn't save the card.",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={card ? `Edit ${card.name}` : 'Add a debit card'} footer={null}>
      <form id="debit-card" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <p className="text-caption text-ink-soft">
          A debit card has no balance of its own. What you spend with it comes straight out of its bank account, so record those
          spends as expenses from that account.
        </p>

        <div className="rounded-lg border border-line">
          <FormRow label="Card" error={errors.name?.message} hint="A name you’ll recognise, like IDBI debit card.">
            <input {...register('name')} autoComplete="off" placeholder="IDBI debit card" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>
          <FormRow label="Bank account" error={errors.accountId?.message} hint="The bank account this card spends from.">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Bank account the card spends from"
              value={watch('accountId') ? String(watch('accountId')) : ''}
              placeholder="Choose one"
              options={banks.map((a) => ({ value: String(a.id), label: a.name }))}
              onChange={(v) => v && setValue('accountId', Number(v), { shouldValidate: true })}
            />
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
          <FormRow label="Last 4" error={errors.lastFour?.message} hint="Only the last 4 digits printed on the card, never the full number.">
            <input {...register('lastFour')} inputMode="numeric" maxLength={4} placeholder="Optional" className={FORM_ROW_CONTROL + ' num'} />
          </FormRow>
        </div>

        {card && confirmingDelete ? (
          <div className="flex flex-col gap-space-3 rounded-lg border border-line p-space-4">
            <p className="text-body text-ink">Remove {card.name}?</p>
            <p className="text-caption text-ink-muted">Nothing else changes - the bank account and its entries stay as they are.</p>
            <div className="flex gap-space-3">
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)} className="flex-1">
                Keep it
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={deleting}
                className="flex-1 !bg-critical"
                onClick={async () => {
                  await deleteCard(card.id).unwrap();
                  onClose();
                }}
              >
                Remove card
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-space-3">
            {card && (
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(true)}>
                Remove
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={creating || updating} className="flex-1">
              {card ? 'Save changes' : 'Save'}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
