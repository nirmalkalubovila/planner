import React from "react"
import { cn } from "@/lib/utils"

/* ─── AI Loading Spinner: uses the animated GIF from public/ ─── */

interface AiLoadingProps {
    size?: "sm" | "md" | "lg"
    text?: string
    className?: string
}

const sizeMap = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
}

export const AiLoading: React.FC<AiLoadingProps> = ({ size = "md", text, className }) => (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <img
            src="/ai-animation-white.gif"
            alt="AI is thinking..."
            className={cn(sizeMap[size], "object-contain")}
        />
        {text && (
            <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
    </div>
)

/* ─── AI Loading Overlay: full-screen or container overlay ─── */

interface AiLoadingOverlayProps {
    text?: string
    fullScreen?: boolean
}

export const AiLoadingOverlay: React.FC<AiLoadingOverlayProps> = ({
    text = "AI is thinking...",
    fullScreen = false,
}) => (
    <div
        className={cn(
            "flex items-center justify-center bg-background/80 backdrop-blur-sm z-50",
            fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-xl"
        )}
    >
        <AiLoading size="lg" text={text} />
    </div>
)

/* ─── AI Inline Loading: small inline indicator ─── */

interface AiInlineLoadingProps {
    text?: string
    className?: string
}

export const AiInlineLoading: React.FC<AiInlineLoadingProps> = ({ text = "Generating...", className }) => (
    <div className={cn("flex items-center gap-2", className)}>
        <img
            src="/ai-animation-white.gif"
            alt="Loading"
            className="w-5 h-5 object-contain"
        />
        <span className="text-xs text-muted-foreground">{text}</span>
    </div>
)
