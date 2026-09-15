import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CycleData } from '@/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  onSave: (data: CycleData) => void;
}

export default function OnboardingForm({ onSave }: Props) {
  const theme = useTheme();
  const today = new Date();

  const [lastPeriodDate, setLastPeriodDate] = useState(today);
  const [showPicker, setShowPicker] = useState(false);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) setLastPeriodDate(selected);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!cycleLength || parseInt(cycleLength) < 21 || parseInt(cycleLength) > 35)
      e.cycleLength = '21–35 hari';
    if (!periodDuration || parseInt(periodDuration) < 2 || parseInt(periodDuration) > 10)
      e.periodDuration = '2–10 hari';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      lastPeriodStart: lastPeriodDate.toISOString(),
      cycleLength: parseInt(cycleLength),
      periodDuration: parseInt(periodDuration),
    });
  };

  return (
    <View
      className="rounded-[20px] p-6"
      style={{ backgroundColor: theme.surfaceElevated, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
    >
      <View className="items-center mb-4">
        <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
          <Ionicons name="calendar-outline" size={24} color={theme.primary} />
        </View>
      </View>
      <Text className="text-[22px] font-bold font-rounded-bold text-center mb-1.5" style={{ color: theme.textPrimary }}>Siklus Pertama</Text>
      <Text className="text-sm text-center font-rounded mb-6 leading-5" style={{ color: theme.textSecondary }}>
        Isi data siklus menstruasi kamu untuk mulai melacak
      </Text>

      <Text className="text-[13px] font-semibold font-rounded-semibold mb-1.5" style={{ color: theme.textSecondary }}>Hari Pertama Haid Terakhir</Text>
      <TouchableOpacity
        className="flex-row items-center gap-2.5 rounded-xl px-3.5 py-3.5 border mb-4"
        style={{ backgroundColor: theme.background, borderColor: errors.lastPeriod ? theme.expense : theme.border }}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.textTertiary} />
        <Text className="text-[15px] font-rounded" style={{ color: theme.textPrimary }}>{formatDate(lastPeriodDate)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={lastPeriodDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={today}
          onChange={onDateChange}
        />
      )}

      <View className="flex-row gap-3">
        <View className="flex-1 mb-4 gap-1.5">
          <Text className="text-[13px] font-semibold font-rounded-semibold mb-1.5" style={{ color: theme.textSecondary }}>Panjang Siklus (hari)</Text>
          <TextInput
            className="rounded-xl px-3.5 text-[15px] font-rounded border"
            style={{
              backgroundColor: theme.background, color: theme.textPrimary,
              borderColor: errors.cycleLength ? theme.expense : theme.border,
              paddingVertical: Platform.OS === 'ios' ? 14 : 10,
            }}
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="number-pad"
            placeholder="28"
            placeholderTextColor={theme.textTertiary}
          />
          {errors.cycleLength && <Text className="text-[11px] font-rounded" style={{ color: theme.expense }}>{errors.cycleLength}</Text>}
        </View>
        <View className="flex-1 mb-4 gap-1.5">
          <Text className="text-[13px] font-semibold font-rounded-semibold mb-1.5" style={{ color: theme.textSecondary }}>Lama Haid (hari)</Text>
          <TextInput
            className="rounded-xl px-3.5 text-[15px] font-rounded border"
            style={{
              backgroundColor: theme.background, color: theme.textPrimary,
              borderColor: errors.periodDuration ? theme.expense : theme.border,
              paddingVertical: Platform.OS === 'ios' ? 14 : 10,
            }}
            value={periodDuration}
            onChangeText={setPeriodDuration}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={theme.textTertiary}
          />
          {errors.periodDuration && <Text className="text-[11px] font-rounded" style={{ color: theme.expense }}>{errors.periodDuration}</Text>}
        </View>
      </View>

      <TouchableOpacity
        className="rounded-[14px] py-3.5 items-center mt-2"
        style={{ backgroundColor: theme.primary }}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-bold font-rounded-bold">Mulai Lacak</Text>
      </TouchableOpacity>
    </View>
  );
}
