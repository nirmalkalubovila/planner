import React from 'react';
import { View } from 'react-native';
import { Check, Edit2, X } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { Text } from '@/components/ui/typography';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ENERGY_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const LEVEL_OPTIONS = ['very low', 'low', 'normal', 'high', 'very high'];

interface ProfilePreferencesProps {
  user: any;
  profile: any;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  loading: boolean;
  onSave: () => void;
  formData: {
    sleepStart: string;
    setSleepStart: (val: string) => void;
    sleepDuration: string;
    setSleepDuration: (val: string) => void;
    weekStart: string;
    setWeekStart: (val: string) => void;
    planDay: string;
    setPlanDay: (val: string) => void;
    planStartTime: string;
    setPlanStartTime: (val: string) => void;
    planEndTime: string;
    setPlanEndTime: (val: string) => void;
    primaryLifeFocus: string;
    setPrimaryLifeFocus: (val: string) => void;
    currentProfession: string;
    setCurrentProfession: (val: string) => void;
    energyPeakTime: string;
    setEnergyPeakTime: (val: string) => void;
    focusAbility: string;
    setFocusAbility: (val: string) => void;
    taskShiftingAbility: string;
    setTaskShiftingAbility: (val: string) => void;
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5 flex-1">
      <Text variant="small" className="font-semibold">
        {label}
      </Text>
      {children}
    </View>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 mb-4">
      <Text variant="tiny" className="uppercase font-semibold mb-1">
        {label}
      </Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

export const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({
  user,
  profile,
  isEditing,
  setIsEditing,
  loading,
  onSave,
  formData,
}) => {
  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-foreground">Planner Preferences</Text>
        {!isEditing && (
          <Button variant="ghost" size="sm" onPress={() => setIsEditing(true)}>
            <View className="flex-row items-center gap-1.5">
              <Edit2 size={14} color="#a1a1aa" />
              <Text variant="small">Edit</Text>
            </View>
          </Button>
        )}
      </View>

      {isEditing ? (
        <View className="gap-5">
          <View className="flex-row gap-4">
            <Field label="Sleep Start Time">
              <SimpleTimePicker value={formData.sleepStart} onChange={formData.setSleepStart} />
            </Field>
            <Field label="Sleep Duration (hours)">
              <Input
                value={formData.sleepDuration}
                onChangeText={formData.setSleepDuration}
                keyboardType="number-pad"
              />
            </Field>
          </View>

          <View className="flex-row gap-4 pt-4 border-t border-border">
            <Field label="Week Starts On">
              <SelectField value={formData.weekStart} onValueChange={formData.setWeekStart} options={WEEKDAYS} title="Week Starts On" />
            </Field>
            <Field label="Planning Day">
              <SelectField value={formData.planDay} onValueChange={formData.setPlanDay} options={WEEKDAYS} title="Planning Day" />
            </Field>
          </View>

          <View className="flex-row gap-4">
            <Field label="Planning Start Time">
              <SimpleTimePicker value={formData.planStartTime} onChange={formData.setPlanStartTime} />
            </Field>
            <Field label="Planning End Time">
              <SimpleTimePicker value={formData.planEndTime} onChange={formData.setPlanEndTime} />
            </Field>
          </View>

          <View className="flex-row gap-4 pt-4 border-t border-border">
            <Field label="Primary Life Focus">
              <Input
                value={formData.primaryLifeFocus}
                onChangeText={formData.setPrimaryLifeFocus}
                placeholder="e.g., Career, Health"
              />
            </Field>
            <Field label="Profession / Status">
              <Input
                value={formData.currentProfession}
                onChangeText={formData.setCurrentProfession}
                placeholder="e.g., Engineer, Student"
              />
            </Field>
          </View>

          <View className="gap-4 pt-4 border-t border-border">
            <Field label="Energy Peak">
              <SelectField value={formData.energyPeakTime} onValueChange={formData.setEnergyPeakTime} options={ENERGY_OPTIONS} title="Energy Peak" />
            </Field>
            <Field label="Focus Ability">
              <SelectField value={formData.focusAbility} onValueChange={formData.setFocusAbility} options={LEVEL_OPTIONS} title="Focus Ability" />
            </Field>
            <Field label="Task Switching">
              <SelectField value={formData.taskShiftingAbility} onValueChange={formData.setTaskShiftingAbility} options={LEVEL_OPTIONS} title="Task Switching" />
            </Field>
          </View>

          <View className="flex-row gap-3 pt-2">
            <Button onPress={onSave} loading={loading} className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Check size={16} color="#000000" />
                <Text className="text-primary-foreground font-semibold">Save Changes</Text>
              </View>
            </Button>
            <Button variant="outline" onPress={() => setIsEditing(false)} disabled={loading} className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <X size={16} color="#e4e4e7" />
                <Text className="text-foreground font-semibold">Cancel</Text>
              </View>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-row flex-wrap">
          <ReadRow label="Sleep" value={`${profile?.sleepStart || '22:00'} (${profile?.sleepDuration || '8'}h)`} />
          <ReadRow label="Week Start" value={profile?.weekStart || 'Monday'} />
          <ReadRow label="Planning" value={`${profile?.planDay || 'Sunday'} ${profile?.planStartTime || '21:00'} - ${profile?.planEndTime || '22:00'}`} />
          <ReadRow label="Focus" value={profile?.primaryLifeFocus || 'Not set'} />
          <ReadRow label="Profession" value={profile?.currentProfession || 'Not set'} />
          <ReadRow label="Energy Peak" value={profile?.energyPeakTime || 'Morning'} />
          <ReadRow label="Focus Level" value={profile?.focusAbility || 'Normal'} />
          <ReadRow label="Task Switching" value={profile?.taskShiftingAbility || 'Normal'} />
        </View>
      )}
    </View>
  );
};
