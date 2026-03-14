import React from "react"
import { cn } from "@/lib/utils"

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
