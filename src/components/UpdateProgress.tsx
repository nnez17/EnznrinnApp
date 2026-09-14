import React from 'react';
import {
  View, Text, Modal, ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

interface UpdateProgressProps {
  visible: boolean;
  progress: number;
}

function clampProgress(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export default function UpdateProgress({ visible, progress }: UpdateProgressProps) {
  const theme = useTheme();
  const pct = clampProgress(progress);
  const percent = Math.round(pct * 100);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-[rgba(0,0,0,0.4)] justify-center items-center p-8">
        <View className="w-full max-w-[300px] rounded-3xl p-8 gap-4 items-center" style={{ backgroundColor: theme.surfaceElevated }}>
          {pct < 1 ? (
            <>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text className="text-base font-semibold text-center" style={{ color: theme.textPrimary }}>
                Mendownload update...
              </Text>
              <View className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                <View className="h-full rounded-full" style={{ backgroundColor: theme.primary, width: `${percent}%` }} />
              </View>
              <Text className="text-sm font-bold" style={{ color: theme.textSecondary }}>
                {percent}%
              </Text>
            </>
          ) : (
            <>
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: theme.success + '15' }}>
                <Ionicons name="checkmark-circle" size={32} color={theme.success} />
              </View>
              <Text className="text-base font-semibold text-center" style={{ color: theme.textPrimary }}>
                Update siap!
              </Text>
              <Text className="text-sm text-center" style={{ color: theme.textSecondary }}>
                Memuat ulang...
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
