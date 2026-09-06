import * as React from 'react';
import { ActivityIndicator, Pressable, Text as RNText, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva('flex-row items-center justify-center rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary active:bg-primary/90',
      destructive: 'bg-destructive active:bg-destructive/90',
      outline: 'border border-input bg-background active:bg-accent',
      secondary: 'bg-secondary active:bg-secondary/80',
      ghost: 'active:bg-accent',
      link: '',
    },
    size: {
      default: 'h-9 px-4',
      sm: 'h-8 px-3',
      lg: 'h-10 px-8',
      icon: 'h-9 w-9',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
    size: {
      default: '',
      sm: 'text-xs',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export interface ButtonProps
  extends Omit<PressableProps, 'children'>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, textClassName, variant, size, disabled, loading, children, ...props }, ref) => {
    const isDisabled = Boolean(disabled || loading);
    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), isDisabled && 'opacity-50', className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" />
        ) : typeof children === 'string' ? (
          <RNText className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {children}
          </RNText>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
