import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    return (
        <div className={cn("relative w-full", className)}>
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat="yyyy-MM-dd"
                placeholderText={placeholderText}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    );
};
