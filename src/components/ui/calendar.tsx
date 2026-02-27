"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    getYear,
    getMonth,
    setMonth,
    setYear,
} from "date-fns"

import { cn } from "@/lib/utils"

interface CalendarProps {
    mode?: "single"
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
    captionLayout?: "buttons" | "dropdown"
    fromYear?: number
    toYear?: number
    initialFocus?: boolean
    showOutsideDays?: boolean
    defaultMonth?: Date
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function Calendar({
    selected,
    onSelect,
    className,
    captionLayout = "buttons",
    fromYear = 1900,
    toYear = new Date().getFullYear(),
    showOutsideDays = true,
    defaultMonth,
}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(
        defaultMonth || selected || new Date()
    )

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    // Build all the days to display
    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
        days.push(day)
        day = addDays(day, 1)
    }

    // Build weeks (rows of 7)
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7))
    }

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value)))
    }

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)))
    }

    const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)
    const months = Array.from({ length: 12 }, (_, i) => i)

    const isToday = (d: Date) => isSameDay(d, new Date())
    const isSelected = (d: Date) => selected ? isSameDay(d, selected) : false
    const isOutside = (d: Date) => !isSameMonth(d, currentMonth)

    return (
        <div className={cn("p-3", className)}>
            {/* Caption / Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {captionLayout === "dropdown" ? (
                    <div className="flex gap-2 items-center">
                        <select
                            value={getMonth(currentMonth)}
                            onChange={handleMonthChange}
                            className="appearance-none bg-accent text-foreground border border-border rounded-md px-2 py-1 text-sm font-medium cursor-pointer outline-none focus:ring-1 focus:ring-ring"
                        >
                            {months.map((m) => (
                                <option key={m} value={m} className="bg-popover text-foreground">
                                    {format(new Date(2000, m, 1), "MMMM")}
                                </option>
                            ))}
                        </select>
                        <select
                            value={getYear(currentMonth)}
                            onChange={handleYearChange}
                            className="appearance-none bg-accent text-foreground border border-border rounded-md px-2 py-1 text-sm font-medium cursor-pointer outline-none focus:ring-1 focus:ring-ring"
                        >
                            {years.map((y) => (
                                <option key={y} value={y} className="bg-popover text-foreground">
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <span className="text-sm font-medium text-foreground">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                )}

                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((wd) => (
                    <div
                        key={wd}
                        className="h-9 w-9 flex items-center justify-center text-muted-foreground text-[0.8rem] font-normal"
                    >
                        {wd}
                    </div>
                ))}
            </div>

            {/* Day Grid */}
            {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                    {week.map((d, di) => {
                        const outside = isOutside(d)
                        if (outside && !showOutsideDays) {
                            return <div key={di} className="h-9 w-9" />
                        }
                        return (
                            <button
                                key={di}
                                type="button"
                                onClick={() => onSelect?.(d)}
                                className={cn(
                                    "h-9 w-9 flex items-center justify-center rounded-md text-sm transition-colors",
                                    outside && "text-muted-foreground opacity-40",
                                    !outside && !isSelected(d) && !isToday(d) && "text-foreground hover:bg-accent",
                                    isToday(d) && !isSelected(d) && "bg-accent text-accent-foreground font-semibold",
                                    isSelected(d) && "bg-primary text-primary-foreground font-semibold",
                                )}
                            >
                                {format(d, "d")}
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
export type { CalendarProps }
