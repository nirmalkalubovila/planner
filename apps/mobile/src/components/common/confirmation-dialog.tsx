import * as React from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { StandardDialog } from './standard-dialog';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onCancel,
  variant = 'default',
}) => {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={AlertTriangle}
      iconClassName={variant === 'destructive' ? 'bg-destructive/10' : 'bg-amber-500/10'}
      footer={
        <View className="flex-row gap-3 justify-end">
          <Button variant="ghost" onPress={handleCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onPress={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </View>
      }
    >
      <View className="p-5">
        <Text variant="muted">{description}</Text>
      </View>
    </StandardDialog>
  );
};
