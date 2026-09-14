import React from 'react';
import {
  View, Text, Modal, Pressable,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';
import Ionicons from '@expo/vector-icons/Ionicons';

interface UpdateDialogProps {
  visible: boolean;
  newVersion?: string | null;
  nativeApk?: boolean;
  onRestart: () => void;
  onLater: () => void;
}

export default function UpdateDialog({ visible, newVersion, nativeApk, onRestart, onLater }: UpdateDialogProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable className="flex-1 bg-[rgba(0,0,0,0.5)] justify-center items-center p-8" onPress={onLater}>
        <Pressable className="w-full max-w-[340px] rounded-3xl p-6 gap-4 items-center" style={{ backgroundColor: theme.surfaceElevated }} onPress={() => {}}>
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: theme.primary + '15' }}>
            <Ionicons name="cloud-download-outline" size={32} color={theme.primary} />
          </View>
          <Text className="text-lg font-bold text-center" style={{ color: theme.textPrimary }}>
            Versi {newVersion ? `v${newVersion}` : 'terbaru'} tersedia
          </Text>
          <Text className="text-sm text-center leading-5" style={{ color: theme.textSecondary }}>
            {nativeApk
              ? 'Versi aplikasi baru siap diunduh. Kamu akan dibawa ke layar instalasi Android.'
              : 'Versi terbaru aplikasi telah tersedia. Restart aplikasi sekarang untuk menggunakan versi terbaru.'}
          </Text>
          <View className="flex-row gap-3 w-full mt-2">
            <Button title="Nanti" variant="ghost" onPress={onLater} style={{ flex: 1 }} />
            <Button title={nativeApk ? 'Unduh & Pasang' : 'Restart Sekarang'} variant="primary" onPress={onRestart} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
