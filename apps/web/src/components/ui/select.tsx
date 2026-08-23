import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"

interface SelectProps {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
    placeholder?: string
    className?: string
}

const SelectContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <Popover open={open} onOpenChange={setOpen}>
                <div className={cn("relative w-full", className)}>
                    {children}
                </div>
            </Popover>
        </SelectContext.Provider>
    )
}

export const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) return null

    return (
        <PopoverTrigger asChild>
            <button
                ref={ref}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-muted px-3 py-2 text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
        </PopoverTrigger>
    )
})
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const context = React.useContext(SelectContext)
    if (!context) return null
    return <span className="truncate">{context.value || placeholder}</span>
}

export const SelectContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <PopoverContent
            className={cn("w-[--radix-popover-trigger-width] min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-foreground shadow-2xl backdrop-blur-xl", className)}
            align="start"
            sideOffset={4}
        >
            <div className="max-h-60 overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                {children}
            </div>
        </PopoverContent>
    )
}

export const SelectItem = ({
    value,
    children,
    className
}: {
    value: string,
    children: React.ReactNode,
    className?: string
}) => {
    const context = React.useContext(SelectContext)
    if (!context) return null

    const isSelected = context.value === value

    return (
        <button
            type="button"
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-3 pr-9 text-xs font-semibold outline-none transition-colors hover:bg-accent focus:bg-accent disabled:pointer-events-none disabled:opacity-50",
                isSelected ? "text-primary bg-primary/10" : "text-muted-foreground",
                className
            )}
            onClick={() => {
                context.onValueChange?.(value)
                context.setOpen(false)
            }}
        >
            <span className="truncate">{children}</span>
            {isSelected && (
                <span className="absolute inset-y-0 right-3 flex items-center">
                    <Check className="h-3.5 w-3.5" />
                </span>
            )}
        </button>
    )
}
