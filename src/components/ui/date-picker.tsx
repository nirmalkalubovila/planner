"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface CustomDatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    selected,
    onChange,
    placeholderText = "Pick a date",
    className,
}) => {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full flex items-center justify-between text-left font-normal h-9 px-3 rounded-lg border-border bg-muted hover:bg-accent transition-colors",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {selected ? format(selected, "PPP") : placeholderText}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-foreground shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected || undefined}
                    onSelect={(date) => {
                        onChange(date || null)
                        setOpen(false)
                    }}
                    captionLayout="dropdown"
                    fromYear={1900}
                />
            </PopoverContent>
        </Popover>
    )
}
