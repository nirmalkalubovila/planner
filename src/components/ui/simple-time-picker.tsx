import * as React from "react"
import { cn } from "@/lib/utils"
import { FormSelect } from "./form-components"

interface SimpleTimePickerProps {
    value: string // "HH:mm"
    onChange: (value: string) => void
    className?: string
}

export const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ value, onChange, className }) => {
    // Value HH:mm (24-hour)
    const safeValue = value || "09:00"
    const [h24Str, mStr] = safeValue.split(':')
    const h24 = parseInt(h24Str, 10)

    // Convert to 12-hour format for display
    const isPm = h24 >= 12
    const h12 = h24 % 12 || 12
    const displayMinute = mStr || "00"

    const updateTime = (newH12: number, newM: string, newIsPm: boolean) => {
        let finalH24 = newH12
        if (newIsPm && newH12 < 12) finalH24 += 12
        if (!newIsPm && newH12 === 12) finalH24 = 0
        onChange(`${finalH24.toString().padStart(2, '0')}:${newM}`)
    }

    return (
        <div className={cn("grid grid-cols-3 gap-1 w-full", className)}>
            <FormSelect
                value={h12.toString()}
                onChange={(e) => updateTime(parseInt(e.target.value, 10), displayMinute, isPm)}
                className="h-9 px-1 text-center font-medium"
            >
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                    <option key={h} value={h.toString()}>{h}</option>
                ))}
            </FormSelect>
            <FormSelect
                value={displayMinute}
                onChange={(e) => updateTime(h12, e.target.value, isPm)}
                className="h-9 px-1 text-center font-medium"
            >
                {["00", "30"].map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </FormSelect>
            <FormSelect
                value={isPm ? "PM" : "AM"}
                onChange={(e) => updateTime(h12, displayMinute, e.target.value === "PM")}
                className="h-9 px-1 text-center font-medium"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </FormSelect>
        </div>
    )
}
