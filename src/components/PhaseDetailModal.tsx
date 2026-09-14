import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CycleDay, CyclePhase } from '@/types';
import { getPhaseInfo, formatIndonesianDate } from '@/services/cycleService';
import { PHASE_META } from '@/theme/phase';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  visible: boolean;
  day: CycleDay | null;
  onClose: () => void;
}

export default function PhaseDetailModal({ visible, day, onClose }: Props) {
  const theme = useTheme();
  if (!visible || !day) return null;

  if (!day.phase) {
    return (
      <View className="absolute top-0 left-0 right-0 bottom-0 justify-end z-[100]" style={{ backgroundColor: theme.overlay }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View className="rounded-t-3xl p-6 pb-10 max-h-[70%]" style={{ backgroundColor: theme.surfaceElevated }}>
          <View className="flex-row justify-between items-center mb-4">
            <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Ionicons name="calendar-outline" size={22} color={theme.primary} />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text className="text-lg font-semibold font-rounded-semibold mb-0.5" style={{ color: theme.textPrimary }}>
            {formatIndonesianDate(day.date)}
          </Text>
          <Text className="text-2xl font-bold font-rounded-bold mb-0.5" style={{ color: theme.textTertiary }}>Belum ada data</Text>
          <Text className="text-[13px] font-rounded mb-5" style={{ color: theme.textSecondary }}>
            Sebelum siklus dimulai
          </Text>
        </View>
      </View>
    );
  }

  const info = getPhaseInfo(day.phase);
  const meta = PHASE_META[day.phase as CyclePhase];
  const chipBg = { backgroundColor: meta.color + '22' };

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 justify-end z-[100]" style={{ backgroundColor: theme.overlay }}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      <View className="rounded-t-3xl p-6 pb-10 max-h-[70%]" style={{ backgroundColor: theme.surfaceElevated }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="w-11 h-11 rounded-full items-center justify-center" style={chipBg}>
            <Ionicons name={meta.icon} size={22} color={meta.color} />
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-semibold font-rounded-semibold mb-0.5" style={{ color: theme.textPrimary }}>
          {formatIndonesianDate(day.date)}
        </Text>
        <Text className="text-2xl font-bold font-rounded-bold mb-0.5" style={{ color: meta.color }}>{info.label}</Text>
        <Text className="text-[13px] font-rounded mb-5" style={{ color: theme.textSecondary }}>
          Hari ke-{day.dayInCycle} siklus
        </Text>

        <ScrollView className="max-h-[280px]" showsVerticalScrollIndicator={false}>
          <Text className="text-sm font-semibold font-rounded-semibold mb-1.5" style={{ color: theme.textPrimary }}>Penjelasan</Text>
          <Text className="text-sm leading-[22px] font-rounded" style={{ color: theme.textSecondary }}>
            {info.description}
          </Text>

          <Text className="text-sm font-semibold font-rounded-semibold mb-1.5 mt-4" style={{ color: theme.textPrimary }}>
            Tips Perawatan
          </Text>
          <View className="flex-row gap-2.5 p-3.5 rounded-xl items-start" style={{ backgroundColor: theme.primaryLight }}>
            <Ionicons name="bulb-outline" size={16} color={theme.primary} />
            <Text className="flex-1 text-[13px] leading-5 font-rounded" style={{ color: theme.textSecondary }}>{info.tips}</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
