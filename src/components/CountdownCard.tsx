import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CycleData, CyclePhase } from '@/types';
import { getCycleStatus, formatIndonesianDate } from '@/services/cycleService';
import { PHASE_META } from '@/theme/phase';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CountdownCard({ data }: { data: CycleData }) {
  const theme = useTheme();
  const status = getCycleStatus(data);

  let title: string;
  let subtitle: string;

  if (!status.hasStarted) {
    title = 'Siap!';
    subtitle = 'Data siklus tersimpan';
  } else if (status.isPeriodDay) {
    title = 'Hari ini Haid!';
    subtitle = 'Istirahat yang cukup ya sayang ❤️';
  } else if (status.daysUntil <= 0) {
    if (status.daysUntil === 0) {
      title = 'Mulai Hari Ini!';
      subtitle = 'Perkiraan haid hari ini';
    } else {
      title = `${Math.abs(status.daysUntil)} Hari Terlambat`;
      subtitle = 'Siklus mungkin lebih panjang dari biasanya';
    }
  } else if (status.daysUntil === 1) {
    title = 'Besok!';
    subtitle = formatIndonesianDate(status.nextPeriodDate.toISOString());
  } else {
    title = `${status.daysUntil}`;
    subtitle = `hari lagi • ${formatIndonesianDate(status.nextPeriodDate.toISOString())}`;
  }

  const accent = status.phase ? PHASE_META[status.phase] : null;
  const accentBg = accent ? { backgroundColor: accent.color + '22' } : { backgroundColor: theme.primaryLight };
  const accentFg = accent ? { color: accent.color } : { color: theme.textSecondary };

  return (
    <View
      className="rounded-[20px] mb-4 overflow-hidden"
      style={{ backgroundColor: theme.surfaceElevated, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
    >
      <View className="flex-row items-center gap-2 px-5 py-2" style={accentBg}>
          <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: theme.surfaceElevated }}>
            <Ionicons name={accent ? accent.icon : 'calendar-outline'} size={18} color={accent ? accent.color : theme.primary} />
          </View>
          <Text className="text-xs font-semibold font-rounded-semibold tracking-[0.3px]" style={accentFg}>{accent ? accent.label : 'Siap'}</Text>
      </View>
      <View className="p-5">
        {!status.isPeriodDay && status.hasStarted && (
          <Text className="text-[11px] font-semibold font-rounded-semibold uppercase tracking-[0.8px] mb-0.5" style={{ color: theme.textSecondary }}>Haid dalam</Text>
        )}
        <Text className="text-[36px] font-bold font-rounded-bold tracking-[-1px] mb-0.5" style={{ color: theme.textPrimary }}>{title}</Text>
        <Text className="text-[13px] leading-[18px] font-rounded mb-5" style={{ color: theme.textSecondary }}>{subtitle}</Text>
        {status.hasStarted && (
          <View className="flex-row gap-2">
            <View className="flex-row items-center gap-1 px-2.5 py-[5px] rounded-lg" style={accentBg}>
              <Ionicons name="calendar-number-outline" size={12} color={theme.textTertiary} />
              <Text className="text-xs font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Hari ke-{status.dayInCycle}</Text>
            </View>
            <View className="flex-row items-center gap-1 px-2.5 py-[5px] rounded-lg" style={accentBg}>
              <Ionicons name="repeat-outline" size={12} color={theme.textTertiary} />
              <Text className="text-xs font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Siklus {data.cycleLength} hr</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
