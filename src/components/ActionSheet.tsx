import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform } from 'react-native';
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
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.textTertiary }]} />

          {(title || message) && (
            <View style={styles.header}>
              {title && <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>}
              {message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
            </View>
          )}

          <View style={styles.optionsContainer}>
            {options.map((opt, i) => (
              <Pressable
                key={i}
                style={[
                  styles.option,
                  { borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: theme.separator },
                  opt.style === 'cancel' && { marginTop: 8, borderRadius: 14, backgroundColor: theme.surface },
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(() => opt.onPress?.(), 200);
                }}
              >
                <Text style={[
                  styles.optionText,
                  { color: opt.style === 'destructive' ? '#FF3B30' : theme.primary },
                  opt.style === 'cancel' && { fontWeight: '600' },
                ]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: 'SFProRounded-Regular',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  optionsContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 17,
    fontFamily: 'SFProRounded-Semibold',
  },
});
