import * as React from "react"
import { cn } from "@/lib/utils"

/* ─── Headings ─── */

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const headingStyles: Record<string, string> = {
    h1: "text-3xl md:text-4xl font-bold tracking-tight text-foreground",
    h2: "text-2xl font-bold tracking-tight text-foreground",
    h3: "text-xl font-semibold tracking-tight text-foreground",
    h4: "text-lg font-semibold text-foreground",
    h5: "text-base font-semibold text-foreground",
    h6: "text-sm font-semibold uppercase tracking-wider text-foreground",
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
    ({ as: Tag = "h2", className, ...props }, ref) => {
        return React.createElement(Tag, {
            ref,
            className: cn(headingStyles[Tag], className),
            ...props,
        })
    }
)
Heading.displayName = "Heading"

/* ─── Paragraph / Text ─── */

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    variant?: "default" | "muted" | "small" | "tiny" | "lead"
}

const textStyles: Record<string, string> = {
    default: "text-sm text-foreground leading-relaxed",
    muted: "text-sm text-muted-foreground leading-relaxed",
    small: "text-xs text-muted-foreground leading-relaxed",
    tiny: "text-[11px] text-muted-foreground/50",
    lead: "text-base md:text-lg text-muted-foreground leading-relaxed",
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
    ({ variant = "default", className, ...props }, ref) => (
        <p ref={ref} className={cn(textStyles[variant], className)} {...props} />
    )
)
Text.displayName = "Text"

/* ─── Divider ─── */

const Divider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div
        className={cn("h-px bg-gradient-to-r from-transparent via-border to-transparent", className)}
        {...props}
    />
)
Divider.displayName = "Divider"

export { Heading, Text, Divider }
export type { HeadingProps, TextProps }
