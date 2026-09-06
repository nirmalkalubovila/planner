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
    showOutsideDays = true,
    defaultMonth,
}: CalendarProps) {
    const [view, setView] = React.useState<"calendar" | "months" | "years">("calendar")
    const [currentMonth, setCurrentMonth] = React.useState(
        defaultMonth || selected || new Date()
    )
    const [yearRangeStart, setYearRangeStart] = React.useState(
        Math.floor(getYear(currentMonth) / 12) * 12
    )

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    // Build all the days to display
    const daysArr: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
        daysArr.push(day)
        day = addDays(day, 1)
    }

    // Build weeks (rows of 7)
    const weeks: Date[][] = []
    for (let i = 0; i < daysArr.length; i += 7) {
        weeks.push(daysArr.slice(i, i + 7))
    }

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const handleMonthSelect = (m: number) => {
        setCurrentMonth(setMonth(currentMonth, m))
        setView("calendar")
    }

    const handleYearSelect = (y: number) => {
        setCurrentMonth(setYear(currentMonth, y))
        setView("months")
    }

    const isToday = (d: Date) => isSameDay(d, new Date())
    const isSelected = (d: Date) => selected ? isSameDay(d, selected) : false
    const isOutside = (d: Date) => !isSameMonth(d, currentMonth)

    const renderCalendar = () => (
        <>
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
        </>
    )

    const renderMonths = () => (
        <div className="grid grid-cols-3 gap-2 p-1">
            {Array.from({ length: 12 }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => handleMonthSelect(i)}
                    className={cn(
                        "h-10 px-2 rounded-md text-xs font-semibold transition-colors",
                        getMonth(currentMonth) === i
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                    )}
                >
                    {format(new Date(2000, i, 1), "MMM")}
                </button>
            ))}
        </div>
    )

    const renderYears = () => {
        const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i)
        return (
            <div className="grid grid-cols-3 gap-2 p-1">
                {years.map((y) => (
                    <button
                        key={y}
                        type="button"
                        onClick={() => handleYearSelect(y)}
                        className={cn(
                            "h-10 px-2 rounded-md text-xs font-semibold transition-colors",
                            getYear(currentMonth) === y
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-accent"
                        )}
                    >
                        {y}
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className={cn("p-3 w-[280px]", className)}>
            {/* Caption / Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={() => {
                        if (view === "calendar") handlePrevMonth()
                        if (view === "years") setYearRangeStart(yearRangeStart - 12)
                    }}
                    className={cn(
                        "inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                        view === "months" && "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex gap-1 items-center">
                    <button
                        type="button"
                        onClick={() => setView(view === "months" ? "calendar" : "months")}
                        className="px-2 py-1 rounded-md hover:bg-accent text-sm font-bold text-foreground transition-colors"
                    >
                        {format(currentMonth, "MMMM")}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (view === "years") {
                                setView("calendar")
                            } else {
                                setYearRangeStart(Math.floor(getYear(currentMonth) / 12) * 12)
                                setView("years")
                            }
                        }}
                        className="px-2 py-1 rounded-md hover:bg-accent text-sm font-bold text-foreground transition-colors"
                    >
                        {view === "years" ? `${yearRangeStart} - ${yearRangeStart + 11}` : getYear(currentMonth)}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (view === "calendar") handleNextMonth()
                        if (view === "years") setYearRangeStart(yearRangeStart + 12)
                    }}
                    className={cn(
                        "inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                        view === "months" && "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="min-h-[220px]">
                {view === "calendar" && renderCalendar()}
                {view === "months" && renderMonths()}
                {view === "years" && renderYears()}
            </div>
        </div>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
export type { CalendarProps }
