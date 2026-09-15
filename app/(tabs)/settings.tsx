import React from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getCurrentVersion } from '@/services/updateService';


const themeOptions: { key: 'light' | 'dark' | 'kharin'; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'light', icon: 'sunny-outline', label: 'Terang' },
  { key: 'dark', icon: 'moon-outline', label: 'Gelap' },
  { key: 'kharin', icon: 'heart-outline', label: 'Kharin' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, setThemeMode } = useSavings();

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}>
      <View className="mb-2" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[30px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Pengaturan</Text>
      </View>

      <Text className="text-[13px] font-semibold font-rounded-semibold ml-1 mt-3 mb-1.5 uppercase tracking-[0.5px]" style={{ color: theme.textSecondary }}>Tampilan</Text>
      <View className="rounded-[14px] overflow-hidden mb-2">
        <View className="flex-row items-center py-[13px] px-4 gap-3" style={{ backgroundColor: theme.surfaceElevated }}>
          <View className="w-8 h-8 rounded-[10px] items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
            <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
          </View>
          <Text className="flex-1 text-[15px] font-medium font-rounded-medium" style={{ color: theme.textPrimary }}>Mode</Text>
          <View className="flex-row gap-1.5">
            {themeOptions.map((opt) => {
              const isActive = state.themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setThemeMode(opt.key)}
                  className="flex-row items-center gap-1 py-1.5 px-2.5 rounded-[10px] border"
                  style={[
                    { borderColor: theme.border },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={14}
                    color={isActive ? '#FFF' : theme.textSecondary}
                  />
                  <Text
                    className="text-xs font-semibold font-rounded-semibold"
                    style={{ color: isActive ? '#FFF' : theme.textSecondary }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View className="mt-8 py-4 items-center">
        <Text className="text-sm text-center leading-[22px] font-rounded" style={{ color: theme.textTertiary }}>
          Dibuat oleh Noval dengan ❤️ untuk pacarku Kharin
        </Text>
        <Text className="text-xs text-center mt-6 font-rounded" style={{ color: theme.textTertiary }}>
          v{getCurrentVersion()}
        </Text>
      </View>
    </ScrollView>
  );
}
