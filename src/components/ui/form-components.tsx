import * as React from "react"
import { cn } from "@/lib/utils"

/* ─── FormField: wraps label + input with consistent spacing ─── */

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string
    icon?: React.ReactNode
    required?: boolean
    hint?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
    ({ label, icon, required, hint, className, children, ...props }, ref) => (
        <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
            <FormLabel icon={icon}>
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            {children}
            {hint && <p className="text-[11px] text-muted-foreground/50">{hint}</p>}
        </div>
    )
)
FormField.displayName = "FormField"

/* ─── FormLabel ─── */

interface FormLabelProps extends React.HTMLAttributes<HTMLLabelElement> {
    icon?: React.ReactNode
    htmlFor?: string
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
    ({ icon, className, children, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "text-xs font-medium text-muted-foreground flex items-center gap-1.5",
                className
            )}
            {...props}
        >
            {icon}
            {children}
        </label>
    )
)
FormLabel.displayName = "FormLabel"

/* ─── FormSelect: styled native select ─── */

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ className, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(
                "flex h-9 w-full rounded-md border border-input bg-card/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-foreground [&>option]:bg-neutral-900 [&>option]:text-foreground",
                className
            )}
            {...props}
        />
    )
)
FormSelect.displayName = "FormSelect"

/* ─── FormSection: group of fields with optional heading ─── */

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    icon?: React.ReactNode
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, className, children, ...props }) => (
    <div className={cn("space-y-3", className)} {...props}>
        {title && (
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</span>
            </div>
        )}
        {children}
    </div>
)
FormSection.displayName = "FormSection"

export { FormField, FormLabel, FormSelect, FormSection }
export type { FormFieldProps, FormLabelProps, FormSelectProps, FormSectionProps }
