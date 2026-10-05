import { SITUATION_OPTIONS, type SituationStatus } from '@llb/core';
import { OptionChips } from '@/components/common/option-chips';

interface SituationPickerProps {
    value: SituationStatus[];
    onChange: (next: SituationStatus[]) => void;
    className?: string;
}

/**
 * The one place a user says what their life looks like right now. Several can apply (for example student and
 * business owner), and the choice shapes the AI plans and the life-balance targets.
 */
export function SituationPicker({ value, onChange, className }: SituationPickerProps) {
    const toggle = (status: SituationStatus) =>
        onChange(value.includes(status) ? value.filter((s) => s !== status) : [...value, status]);

    return (
        <div className={className}>
            <div className="mb-2">
                <label className="text-sm font-medium">Your current situation</label>
                <p className="text-[11px] text-muted-foreground">Select all that apply.</p>
            </div>
            <OptionChips
                value={value}
                onChange={toggle}
                options={SITUATION_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))}
            />
        </div>
    );
}
