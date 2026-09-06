import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export const Card = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('rounded-xl border border-border bg-card', className)} {...props} />
));
Card.displayName = 'Card';

export const CardContent = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('p-6', className)} {...props} />
));
CardContent.displayName = 'CardContent';
