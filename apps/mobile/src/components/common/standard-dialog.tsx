import * as React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { X, type LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface StandardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideClose?: boolean;
  closeOnBackdrop?: boolean;
}

/** RN twin of apps/web/src/components/common/standard-dialog.tsx — the
 * single app-wide modal primitive, same props API so feature call sites
 * port with no changes to their own logic. Uses RN's own Modal instead of a
 * portal (no DOM to portal into), which also gives the Android back-button
 * dismiss behavior for free. */
export const StandardDialog: React.FC<StandardDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  children,
  footer,
  hideClose = false,
  closeOnBackdrop = true,
}) => {
  return (
    // animationType="none" is deliberate: RN's Android modal fade runs a
    // native ~250ms transition on top of mounting the dialog body, which is
    // what made every popup here feel sluggish rather than instant.
    // hardwareAccelerated keeps the mounted content off the software
    // rasteriser, and statusBarTranslucent avoids a re-layout as the modal
    // window is attached.
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center px-4 bg-black/80">
        <Pressable
          className="absolute inset-0"
          onPress={closeOnBackdrop ? onClose : undefined}
        />
        <View className="max-h-[85%] rounded-2xl border border-border bg-card overflow-hidden">
          <View className="flex-row items-center justify-between p-5 border-b border-border bg-muted/20">
            <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
              {Icon && (
                <View className={cn('p-2 rounded-lg', iconClassName || 'bg-primary/10')}>
                  <Icon size={20} color="#e4e4e7" />
                </View>
              )}
              <View className="flex-1 min-w-0">
                <Heading level="h4" numberOfLines={1}>
                  {title}
                </Heading>
                {subtitle && (
                  <Text variant="tiny" className="uppercase font-bold" numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
            {!hideClose && (
              <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full ml-2">
                <X size={18} color="#e4e4e7" />
              </Button>
            )}
          </View>

          <ScrollView className="flex-shrink" keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          {footer && <View className="p-5 border-t border-border bg-muted/10">{footer}</View>}
        </View>
      </View>
    </Modal>
  );
};
