import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

/* Named `Text`/`Heading` to mirror apps/web/src/components/ui/typography.tsx —
   import as `{ Text as UIText }` at call sites that also need RN's own Text. */

interface TextProps extends RNTextProps {
  variant?: 'default' | 'muted' | 'small' | 'tiny' | 'lead';
}

const textStyles: Record<NonNullable<TextProps['variant']>, string> = {
  default: 'text-sm text-foreground',
  muted: 'text-sm text-muted-foreground',
  small: 'text-xs text-muted-foreground',
  tiny: 'text-[11px] text-muted-foreground',
  lead: 'text-base text-muted-foreground',
};

export const Text = React.forwardRef<RNText, TextProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <RNText ref={ref} className={cn(textStyles[variant], className)} {...props} />
  )
);
Text.displayName = 'Text';

interface HeadingProps extends RNTextProps {
  level?: 'h1' | 'h2' | 'h3' | 'h4';
}

const headingStyles: Record<NonNullable<HeadingProps['level']>, string> = {
  h1: 'text-3xl font-bold tracking-tight text-foreground',
  h2: 'text-2xl font-bold tracking-tight text-foreground',
  h3: 'text-xl font-semibold tracking-tight text-foreground',
  h4: 'text-lg font-semibold text-foreground',
};

export const Heading = React.forwardRef<RNText, HeadingProps>(
  ({ level = 'h2', className, ...props }, ref) => (
    <RNText ref={ref} className={cn(headingStyles[level], className)} {...props} />
  )
);
Heading.displayName = 'Heading';
