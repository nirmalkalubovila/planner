import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './typography';

interface FormFieldProps extends ViewProps {
  label: string;
  icon?: React.ReactNode;
}

export const FormField = React.forwardRef<View, FormFieldProps>(
  ({ label, icon, className, children, ...props }, ref) => (
    <View ref={ref} className={cn('gap-1.5', className)} {...props}>
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text variant="small" className="font-medium">
          {label}
        </Text>
      </View>
      {children}
    </View>
  )
);
FormField.displayName = 'FormField';
