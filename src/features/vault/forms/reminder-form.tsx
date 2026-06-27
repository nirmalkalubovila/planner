import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Clock, Calendar } from 'lucide-react';
import { useAddReminder, useUpdateReminder, useDeleteReminder, VaultReminder } from '@/api/services/reminder-service';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReminderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  existingReminder?: VaultReminder | null;
}

const reminderSchema = z.object({
  title: z.string().min(1, 'Reminder title is required'),
  body: z.string().optional(),
  repeat_type: z.enum(['daily', 'every_2_days', 'weekly', 'random', 'once']),
  remind_at: z.string().optional().nullable(),
  remind_date: z.date().optional().nullable(),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

export const ReminderFormDialog: React.FC<ReminderFormDialogProps> = ({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  existingReminder,
}) => {
  const addReminder = useAddReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const isEdit = !!existingReminder;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: `Remind: ${noteTitle}`,
      body: '',
      repeat_type: 'daily',
      remind_at: '09:00',
      remind_date: new Date(),
    },
  });

  const repeatType = watch('repeat_type');

  useEffect(() => {
    if (isOpen) {
      if (existingReminder) {
        const nextFireDate = new Date(existingReminder.next_fire);
        const hours = String(nextFireDate.getHours()).padStart(2, '0');
        const minutes = String(nextFireDate.getMinutes()).padStart(2, '0');
        reset({
          title: existingReminder.title,
          body: existingReminder.body || '',
          repeat_type: existingReminder.repeat_type,
          remind_at: existingReminder.remind_at || `${hours}:${minutes}`,
          remind_date: nextFireDate,
        });
      } else {
        reset({
          title: `Remind: ${noteTitle}`,
          body: '',
          repeat_type: 'daily',
          remind_at: '09:00',
          remind_date: new Date(),
        });
      }
    }
  }, [isOpen, existingReminder, noteTitle, reset]);

  const onSubmit = (values: ReminderFormValues) => {
    let nextFireISO: string | undefined = undefined;
    if (values.repeat_type === 'once') {
      const date = values.remind_date || new Date();
      const [h, m] = (values.remind_at || '09:00').split(':').map(Number);
      const fireDate = new Date(date);
      fireDate.setHours(h, m, 0, 0);
      nextFireISO = fireDate.toISOString();
    }

    const payload = {
      title: values.title,
      body: values.body,
      repeat_type: values.repeat_type,
      remind_at: values.repeat_type === 'random' ? null : values.remind_at,
      next_fire: nextFireISO,
    };

    if (isEdit && existingReminder) {
      updateReminder.mutate(
        {
          id: existingReminder.id,
          ...payload,
        },
        {
          onSuccess: () => {
            toast.success('Reminder updated');
            onClose();
          },
        }
      );
    } else {
      addReminder.mutate(
        {
          note_id: noteId,
          ...payload,
        },
        {
          onSuccess: () => {
            toast.success('Reminder added to vault');
            onClose();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (existingReminder) {
      deleteReminder.mutate(existingReminder.id, {
        onSuccess: () => {
          toast.success('Reminder removed');
          onClose();
        },
      });
    }
  };

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vault Reminder' : 'Set Vault Reminder'}
      subtitle="SmartRepeating Reminders"
      icon={Bell}
      maxWidth="md"
      footer={
        <div className="flex justify-between items-center w-full gap-3">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 px-4"
              onClick={handleDelete}
              disabled={deleteReminder.isPending}
            >
              Remove
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reminder-form"
              disabled={addReminder.isPending || updateReminder.isPending}
            >
              {isEdit ? 'Save Changes' : 'Set Reminder'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="reminder-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reminder Title</label>
          <Input {...register('title')} placeholder="e.g. Read 10 pages today" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Additional Message (Optional)</label>
          <Input {...register('body')} placeholder="e.g. Small consistent reading rewires your brain" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Frequency</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(['once', 'daily', 'every_2_days', 'weekly', 'random'] as const).map((type) => {
              const label =
                type === 'once'
                  ? '📅 One-time'
                  : type === 'daily'
                  ? 'Daily'
                  : type === 'every_2_days'
                  ? 'Every 2 Days'
                  : type === 'weekly'
                  ? 'Weekly'
                  : '🎲 Random';
              const isSelected = repeatType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('repeat_type', type)}
                  className={cn(
                    'flex items-center justify-center p-2.5 rounded-xl border text-[11px] font-semibold transition-all select-none',
                    isSelected
                      ? 'bg-primary/10 text-primary border-primary/40 shadow-sm'
                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {repeatType === 'once' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Date
            </label>
            <Controller
              name="remind_date"
              control={control}
              render={({ field }) => (
                <CustomDatePicker selected={field.value || null} onChange={field.onChange} />
              )}
            />
          </div>
        )}

        {repeatType !== 'random' ? (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} /> Time of Day
            </label>
            <Controller
              name="remind_at"
              control={control}
              render={({ field }) => (
                <SimpleTimePicker value={field.value || '09:00'} onChange={field.onChange} />
              )}
            />
          </div>
        ) : (
          <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-1 animate-in fade-in duration-200">
            <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              🎲 Random Smart Nudge
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This reminder will surprise you with a repeating alert scheduled at random times during daylight hours (9:00 AM to 9:00 PM) tomorrow and onward. Perfect for forming deep habits.
            </p>
          </div>
        )}
      </form>
    </StandardDialog>
  );
};
