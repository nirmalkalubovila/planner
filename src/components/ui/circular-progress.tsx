import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
  delay?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'stroke-primary',
  trackColor = 'stroke-muted',
  label,
  sublabel,
  className,
  delay = 0.3,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, 100));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={trackColor}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-foreground">{clamped}%</span>
        </div>
      </div>
      {label && <p className="text-xs font-medium text-muted-foreground text-center mt-1">{label}</p>}
      {sublabel && <p className="text-[10px] text-muted-foreground text-center">{sublabel}</p>}
    </div>
  );
};
