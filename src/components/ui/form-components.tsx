import * as React from "react"
import { cn } from "@/lib/utils"

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

export { FormField, FormLabel }
export type { FormFieldProps, FormLabelProps }
