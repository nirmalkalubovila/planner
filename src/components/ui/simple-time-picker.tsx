import * as React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Clock } from "lucide-react"

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

    const [open, setOpen] = React.useState(false)

    const updateTime = (newH12: number, newM: string, newIsPm: boolean) => {
        let finalH24 = newH12
        if (newIsPm && newH12 < 12) finalH24 += 12
        if (!newIsPm && newH12 === 12) finalH24 = 0
        onChange(`${finalH24.toString().padStart(2, '0')}:${newM}`)
    }

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    const minutes = ["00", "30"]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full flex items-center justify-between text-left font-normal h-9 px-3 rounded-lg border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors",
                        className
                    )}
                >
                    <span className="text-sm font-medium text-foreground">
                        {`${h12.toString().padStart(2, '0')}:${displayMinute} ${isPm ? 'PM' : 'AM'}`}
                    </span>
                    <Clock className="h-4 w-4 text-foreground dark:text-white shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-1.5 border-border bg-popover shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden"
                align="start"
                sideOffset={4}
            >
                <div className="flex bg-transparent rounded-lg border border-border overflow-hidden">
                    {/* Hours */}
                    <div className="flex flex-col h-[180px] overflow-y-auto custom-scrollbar w-[56px] relative">
                        <div className="text-[10px] font-bold text-muted-foreground text-center py-2 uppercase tracking-widest bg-muted border-b border-border sticky top-0 z-20">Hr</div>
                        <div className="flex flex-col">
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => updateTime(h, displayMinute, isPm)}
                                    className={cn(
                                        "flex items-center justify-center shrink-0 h-10 text-xs font-semibold transition-all",
                                        h12 === h ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Minutes */}
                    <div className="flex flex-col h-[180px] overflow-y-auto custom-scrollbar w-[56px] border-l border-border relative">
                        <div className="text-[10px] font-bold text-muted-foreground text-center py-2 uppercase tracking-widest bg-muted border-b border-border sticky top-0 z-20">Min</div>
                        <div className="flex flex-col">
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => updateTime(h12, m, isPm)}
                                    className={cn(
                                        "flex items-center justify-center shrink-0 h-10 text-xs font-semibold transition-all",
                                        displayMinute === m ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* AM/PM */}
                    <div className="flex flex-col h-[180px] w-[56px] border-l border-border relative">
                        <div className="text-[10px] font-bold text-muted-foreground text-center py-2 uppercase tracking-widest bg-muted border-b border-border sticky top-0 z-20">Set</div>
                        <div className="flex flex-col gap-0.5 p-1 flex-1 justify-center">
                            {["AM", "PM"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => updateTime(h12, displayMinute, p === "PM")}
                                    className={cn(
                                        "flex items-center justify-center h-14 rounded-md text-[11px] font-black transition-all",
                                        (isPm ? "PM" : "AM") === p ? "bg-primary text-primary-foreground shadow-lg shadow-white/5" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
