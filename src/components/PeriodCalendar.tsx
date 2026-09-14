import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CycleData, CycleDay, CyclePhase } from '@/types';
import { getCalendarDays, getCycleStatus, MONTHS, DAYS } from '@/services/cycleService';
import { PHASE_META } from '@/theme/phase';
import PhaseDetailModal from './PhaseDetailModal';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function PeriodCalendar({ data }: { data: CycleData }) {
  const theme = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<CycleDay | null>(null);

  const weeks = useMemo(() => getCalendarDays(year, month, data), [year, month, data]);
  const status = useMemo(() => getCycleStatus(data), [data]);
  const accent = status.phase ? PHASE_META[status.phase] : null;
  const accentStyle = accent ? { backgroundColor: accent.color } : { backgroundColor: theme.primary };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <View
      className="rounded-[20px] overflow-hidden"
      style={{ backgroundColor: theme.surfaceElevated, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
    >
      <View className="h-1" style={accentStyle} />

      <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={prevMonth} hitSlop={12} className="w-9 h-9 rounded-full items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text className="text-base font-rounded-semibold" style={{ color: theme.textPrimary }}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={12} className="w-9 h-9 rounded-full items-center justify-center">
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {status.hasStarted && (
        <View className="flex-row justify-center gap-3.5 px-4 pb-3 flex-wrap">
          {(Object.keys(PHASE_META) as CyclePhase[]).map(phase => {
            const s = PHASE_META[phase];
            return (
              <View key={phase} className="flex-row items-center gap-[5px]">
                <View className="w-[7px] h-[7px] rounded-[4px]" style={{ backgroundColor: s.color }} />
                <Text className="text-[10px] font-rounded-medium tracking-[0.2px]" style={{ color: theme.textSecondary }}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View className="flex-row px-3 mb-1.5">
        {DAYS.map(d => (
          <Text key={d} className="flex-1 text-center text-[11px] font-rounded-semibold py-1 tracking-[0.3px]" style={{ color: theme.textSecondary }}>{d}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row px-3 mb-0.5">
          {week.map((day, di) => {
            if (!day) return <View key={di} className="flex-1 aspect-square rounded-[10px] m-1.5" />;

            const isPast = !day.isFuture || day.isToday;
            const ps = day.phase && isPast ? PHASE_META[day.phase] : null;

            return (
              <TouchableOpacity
                key={di}
                className={`flex-1 aspect-square rounded-[10px] m-1.5 items-center justify-center ${
                  day.isToday ? '' : ps ? ps.bg : day.isFuture ? '' : 'bg-black/[0.03]'
                }`}
                style={
                  day.isToday ? { backgroundColor: theme.primary }
                  : day.isFuture ? { borderWidth: 1, borderColor: theme.border }
                  : undefined
                }
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  className="text-[13px] font-rounded-semibold"
                  // warna inline: jangan bergantung class text-* utk sel terisi warna
                  style={
                    day.isToday ? { color: '#FFFFFF', fontWeight: '700' }
                    : { color: ps ? '#1C1C1E' : isPast ? theme.textPrimary : theme.textTertiary }
                  }
                >
                  {new Date(day.date).getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <PhaseDetailModal
        visible={!!selectedDay}
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </View>
  );
}
