import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, style, placeholderTextColor, ...props }, ref) => (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? '#71717a'}
      className={cn(
        'w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm text-foreground',
        className
      )}
      // Fixed heights + Android's default EditText padding clip ascenders/
      // descenders; letting py-* size the box and killing includeFontPadding
      // (Android's extra glyph-accent space) avoids that instead.
      style={[{ includeFontPadding: false, textAlignVertical: 'center' }, style]}
      {...props}
    />
  )
);
Input.displayName = 'Input';
