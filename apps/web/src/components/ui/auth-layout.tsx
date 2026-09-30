import React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

/* ─── Auth Page Layout: consistent wrapper for login, signup, forgot, reset, personalize ─── */

interface AuthLayoutProps {
    children: React.ReactNode
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
    className?: string
    fullHeight?: boolean
}

const maxWidthMap: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
}

/** Legacy gold (#D2A226) applied to the auth pages only: primary buttons, links and focus rings pick it up. */
const GOLD_THEME = {
    "--primary": "43 69% 49%",
    "--primary-foreground": "0 0% 0%",
    "--ring": "43 69% 49%",
} as React.CSSProperties

export const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    maxWidth = "md",
    className,
    fullHeight = false,
}) => (
    <div
        style={GOLD_THEME}
        className={cn(
            "relative flex flex-col items-center justify-center bg-background px-4 overflow-hidden",
            fullHeight ? "h-screen py-4" : "min-h-screen py-8",
            className
        )}
    >
        {/* soft gold glow behind the card */}
        <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(210,162,38,0.14), transparent 70%)" }}
        />
        <div className={cn("relative w-full flex-grow flex items-center justify-center", maxWidthMap[maxWidth])}>
            <div className="w-full llb-rise">
                {children}
            </div>
        </div>
        <footer className="relative mt-6 text-center text-[10px] text-muted-foreground space-x-3 select-none">
            <Link to="/privacy" className="hover:underline hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline hover:text-foreground transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/refund" className="hover:underline hover:text-foreground transition-colors">Return Policy</Link>
        </footer>
    </div>
)

/* ─── "Why Legacy Life Builder?" link shown right under the form card ─── */

export const WhyLink: React.FC = () => (
    <div className="mt-4 text-center">
        <Link
            to="/?bypass=true"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-foreground transition-colors"
        >
            Why Legacy Life Builder?
            <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>&rarr;</span>
        </Link>
    </div>
)

/* ─── Auth Header: logo + title + description ─── */

interface AuthHeaderProps {
    icon?: React.ReactNode
    title: string
    description?: string
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ icon, title, description }) => (
    <div className="text-center space-y-1 mb-4">
        <div className="flex justify-center mb-3">
            {icon || (
                <img src="/white-logo.svg" alt="Legacy Life Builder" className="w-10 h-10" />
            )}
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {description}
            </p>
        )}
    </div>
)

/* ─── Auth Divider: "Or continue with" line ─── */

interface AuthDividerProps {
    text?: string
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = "Or continue with" }) => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{text}</span>
        </div>
    </div>
)

/* ─── Auth Error Banner ─── */

export const AuthError: React.FC<{ message: string }> = ({ message }) => {
    if (!message) return null
    return (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {message}
        </div>
    )
}

/* ─── Google Sign-in Button ─── */

interface GoogleButtonProps {
    onClick: () => void
    label?: string
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick, label = "Sign in with Google" }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] transition-all duration-200"
    >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {label}
    </button>
)
