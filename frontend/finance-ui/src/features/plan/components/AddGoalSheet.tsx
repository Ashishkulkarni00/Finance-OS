import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useCreateGoalMutation } from '@/services/goalService';
import { useGetAccountsQuery } from '@/services/accountService';
import { handleEnterAdvance } from '@/lib/formKeyboard';

const schema = z.object({
  name: z.string().min(1, 'Give this goal a name').max(100),
  targetAmount: z
    .string()
    .min(1, 'Enter a target amount')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
    .refine((v) => Number(v) > 0, 'Target must be more than zero'),
  targetDate: z.string().min(1, 'When do you want to reach this by?'),
  linkedAccountId: z.number().nullable(),
});

type FormValues = z.infer<typeof schema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddGoalSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Set a target and Kosh will tell you honestly what it takes" - the Goals empty state
 * has said this since the section was built, with nothing behind it: `createGoal` was
 * wired end-to-end in the service layer and never called from anywhere
 * (DATA_ENTRY_AUDIT.md §4). This is that call site.
 *
 * <p>Tracking against an account is optional and deliberately the only link offered here
 * - a goal can also track a reservation, but reservations have no edit surface of their
 * own yet either, and offering a link to something the user can't yet manage would just
 * relocate the same gap.
 */
export function AddGoalSheet({ open, onClose }: AddGoalSheetProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [createGoal, { isLoading }] = useCreateGoalMutation();
  const [minDate] = useState(todayIso());

  const accounts = accountsPage?.content.filter((a) => !a.archived) ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', targetAmount: '', targetDate: '', linkedAccountId: null },
  });

  const close = () => {
    onClose();
    reset();
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createGoal({
        name: values.name.trim(),
        targetAmount: values.targetAmount,
        targetDate: values.targetDate,
        linkedAccountId: values.linkedAccountId,
      }).unwrap();
      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      if (appError.field) {
        setError(appError.field as keyof FormValues, { message: appError.message });
      } else {
        setError('name', { message: appError.message ?? "Couldn't save. Try again." });
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a goal"
      footer={
        <Button type="submit" form="add-goal" variant="primary" disabled={isLoading} className="w-full">
          Save
        </Button>
      }
    >
      <form id="add-goal" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <div className="rounded-lg border border-line">
          <FormRow label="Goal" error={errors.name?.message}>
            <input {...register('name')} autoComplete="off" placeholder="Emergency fund, a trip, a deposit…" className={FORM_ROW_CONTROL} autoFocus />
          </FormRow>

          <FormRow label="Target" error={errors.targetAmount?.message}>
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input
                {...register('targetAmount')}
                inputMode="decimal"
                placeholder="0"
                className={FORM_ROW_CONTROL + ' num'}
              />
            </span>
          </FormRow>

          <FormRow label="By when" error={errors.targetDate?.message}>
            <input type="date" {...register('targetDate')} min={minDate} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
          </FormRow>

          <Controller
            control={control}
            name="linkedAccountId"
            render={({ field }) => (
              <FormRow label="Tracked in">
                <Select
                  variant="row"
                  className="-ml-space-1 max-w-full"
                  ariaLabel="Account this goal is tracked against"
                  value={field.value ? String(field.value) : ''}
                  placeholder="Not linked to an account yet"
                  clearable
                  options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                  onChange={(v) => field.onChange(v ? Number(v) : null)}
                />
              </FormRow>
            )}
          />
        </div>

        <p className="text-caption text-ink-muted">
          Link an account and Kosh tracks progress from its balance. Leave it unlinked and you can add money toward
          this goal later.
        </p>
      </form>
    </Modal>
  );
}
