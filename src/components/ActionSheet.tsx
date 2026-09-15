import React from 'react';
import { View, Text, Modal, Pressable, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ActionSheetOption {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({ visible, title, message, options, onClose }) => {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-[rgba(0,0,0,0.4)] justify-end" onPress={onClose}>
        <Pressable
          className="rounded-t-[20px] pt-2"
          style={{ backgroundColor: theme.surfaceElevated, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}
          onPress={() => {}}
        >
          <View className="w-9 h-[5px] rounded-full self-center mb-2" style={{ backgroundColor: theme.textTertiary }} />

          {(title || message) && (
            <View className="items-center px-6 py-3">
              {title && <Text className="text-[17px] font-bold font-rounded-bold text-center" style={{ color: theme.textPrimary }}>{title}</Text>}
              {message && <Text className="text-[13px] font-rounded text-center mt-1 leading-[18px]" style={{ color: theme.textSecondary }}>{message}</Text>}
            </View>
          )}

          <View className="px-3 pt-1">
            {options.map((opt, i) => (
              <Pressable
                key={i}
                className="py-4 items-center justify-center"
                style={[
                  { borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: theme.separator },
                  opt.style === 'cancel' && { marginTop: 8, borderRadius: 14, backgroundColor: theme.surface },
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(() => opt.onPress?.(), 200);
                }}
              >
                <Text
                  className={`text-[17px] font-rounded-semibold ${opt.style === 'cancel' ? 'font-semibold' : ''}`}
                  style={{ color: opt.style === 'destructive' ? '#FF3B30' : theme.primary }}
                >
                  {opt.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
