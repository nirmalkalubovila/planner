import * as React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Clock } from "lucide-react"

interface SimpleTimePickerProps {
    value: string // "HH:mm"
    onChange: (value: string) => void
    className?: string
    allowAllMinutes?: boolean
}

export const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ value, onChange, className, allowAllMinutes }) => {
    // Value HH:mm (24-hour)
    const safeValue = value || "09:00"
    const [h24Str, mStr] = safeValue.split(':')
    const h24 = parseInt(h24Str, 10)

    // Convert to 12-hour format for display
    const isPm = h24 >= 12
    const h12 = h24 % 12 || 12
    const displayMinute = mStr || "00"

    const [open, setOpen] = React.useState(false)
    const hourContainerRef = React.useRef<HTMLDivElement>(null)
    const minuteContainerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (open) {
            setTimeout(() => {
                const selectedHourBtn = hourContainerRef.current?.querySelector('[data-selected="true"]')
                if (selectedHourBtn) {
                    selectedHourBtn.scrollIntoView({ block: 'center', behavior: 'instant' as any })
                }
                const selectedMinBtn = minuteContainerRef.current?.querySelector('[data-selected="true"]')
                if (selectedMinBtn) {
                    selectedMinBtn.scrollIntoView({ block: 'center', behavior: 'instant' as any })
                }
            }, 50)
        }
    }, [open])

    const updateTime = (newH12: number, newM: string, newIsPm: boolean) => {
        let finalH24 = newH12
        if (newIsPm && newH12 < 12) finalH24 += 12
        if (!newIsPm && newH12 === 12) finalH24 = 0
        onChange(`${finalH24.toString().padStart(2, '0')}:${newM}`)
    }

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    const minutes = allowAllMinutes
        ? Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
        : ["00", "30"]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full flex items-center justify-between text-left font-medium h-11 px-3.5 rounded-xl border border-input bg-muted/40 hover:bg-muted/60 text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary/20",
                        className
                    )}
                >
                    <span className="text-sm font-semibold">
                        {`${h12.toString().padStart(2, '0')}:${displayMinute} ${isPm ? 'PM' : 'AM'}`}
                    </span>
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 transition-colors" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 border border-border/40 bg-popover/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden"
                align="start"
                sideOffset={6}
            >
                <div className="flex bg-transparent overflow-hidden">
                    {/* Hours */}
                    <div ref={hourContainerRef} className="flex flex-col h-[190px] overflow-y-auto custom-scrollbar w-[60px] relative">
                        <div className="text-[10px] font-bold text-muted-foreground/60 text-center py-2 uppercase tracking-widest bg-popover/80 border-b border-border/20 sticky top-0 z-20 backdrop-blur-md">Hr</div>
                        <div className="flex flex-col p-1 gap-0.5">
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    data-selected={h12 === h}
                                    onClick={() => updateTime(h, displayMinute, isPm)}
                                    className={cn(
                                        "flex items-center justify-center shrink-0 h-9 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                                        h12 === h 
                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                            : "text-muted-foreground/70 hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Minutes */}
                    <div ref={minuteContainerRef} className="flex flex-col h-[190px] overflow-y-auto custom-scrollbar w-[60px] border-l border-border/20 relative">
                        <div className="text-[10px] font-bold text-muted-foreground/60 text-center py-2 uppercase tracking-widest bg-popover/80 border-b border-border/20 sticky top-0 z-20 backdrop-blur-md">Min</div>
                        <div className="flex flex-col p-1 gap-0.5">
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    data-selected={displayMinute === m}
                                    onClick={() => updateTime(h12, m, isPm)}
                                    className={cn(
                                        "flex items-center justify-center shrink-0 h-9 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                                        displayMinute === m 
                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                            : "text-muted-foreground/70 hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* AM/PM */}
                    <div className="flex flex-col h-[190px] w-[60px] border-l border-border/20 relative">
                        <div className="text-[10px] font-bold text-muted-foreground/60 text-center py-2 uppercase tracking-widest bg-popover/80 border-b border-border/20 sticky top-0 z-20 backdrop-blur-md">Set</div>
                        <div className="flex flex-col gap-1 p-1.5 flex-1 justify-center">
                            {["AM", "PM"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => updateTime(h12, displayMinute, p === "PM")}
                                    className={cn(
                                        "flex items-center justify-center h-16 rounded-lg text-[11px] font-black transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 border border-transparent",
                                        (isPm ? "PM" : "AM") === p 
                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                            : "text-muted-foreground/70 hover:bg-accent hover:text-foreground"
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
