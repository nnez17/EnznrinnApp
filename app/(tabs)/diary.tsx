import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView,
  Modal, Pressable, KeyboardAvoidingView, Platform,
  TouchableOpacity, TextInput,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';
import { ActionSheet } from '@/components/ActionSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MoodType } from '@/types';

const moodConfig: Record<MoodType, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Senang' },
  love: { emoji: '🥰', label: 'Sayang' },
  excited: { emoji: '😆', label: 'Semangat' },
  neutral: { emoji: '😐', label: 'Biasa' },
  sad: { emoji: '😢', label: 'Sedih' },
  stressed: { emoji: '😰', label: 'Stres' },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, loadDiary, saveDiaryEntry, updateDiaryEntry, deleteDiaryEntry } = useSavings();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [errorSheet, setErrorSheet] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  useEffect(() => {
    loadDiary();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entryMap = useMemo(() => {
    const map = new Map<string, typeof state.diary[0]>();
    state.diary.forEach(e => {
      const dateKey = e.date.split('T')[0];
      map.set(dateKey, e);
    });
    return map;
  }, [state.diary]);

  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();

  const changeMonth = (delta: number) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1));
  };

  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isPastDate = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const isTodayDate = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const openEditor = (date: Date) => {
    setSelectedDate(date);
    const dateKey = formatDateKey(date);
    const existing = entryMap.get(dateKey);
    if (existing) {
      setEditEntryId(existing.id);
      setContent(existing.content);
      setSelectedMood(existing.mood || null);
    } else {
      setEditEntryId(null);
      setContent('');
      setSelectedMood(null);
    }
    setShowEditor(true);
  };

  const viewOnly = selectedDate ? isPastDate(selectedDate) : false;

  const handleSave = async () => {
    if (!selectedDate) return;
    if (!content.trim()) {
      setErrorSheet({ visible: true, message: 'Tulis sesuatu dulu' });
      return;
    }
    const dateISO = selectedDate.toISOString();
    try {
      if (editEntryId) {
        await updateDiaryEntry(editEntryId, { content: content.trim(), mood: selectedMood || undefined });
      } else {
        await saveDiaryEntry(dateISO, content.trim(), selectedMood || undefined);
      }
    } catch (e) {
      setErrorSheet({ visible: true, message: e instanceof Error ? e.message : 'Gagal menyimpan' });
      return;
    }
    setShowEditor(false);
    setSelectedDate(null);
    setEditEntryId(null);
    setContent('');
    setSelectedMood(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDiaryEntry(deleteTarget);
    } catch (e) {
      setErrorSheet({ visible: true, message: e instanceof Error ? e.message : 'Gagal menghapus' });
      return;
    }
    setDeleteTarget(null);
    if (showEditor) setShowEditor(false);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[30px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Diary</Text>
        <Text className="text-[15px] mt-0.5 font-rounded" style={{ color: theme.textSecondary }}>Cerita harianmu</Text>
      </View>

      <View className="flex-row items-center justify-between mx-4 py-3 px-4 rounded-[14px] border mb-2" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <TouchableOpacity onPress={() => changeMonth(-1)} className="w-8 h-8 rounded-full items-center justify-center">
          <Ionicons name="chevron-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text className="text-base font-bold font-rounded-bold" style={{ color: theme.textPrimary }}>
          {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} className="w-8 h-8 rounded-full items-center justify-center">
          <Ionicons name="chevron-forward" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View className="flex-row mx-4 border-b pb-2 mb-1" style={{ borderColor: theme.border }}>
        {DAY_NAMES.map(d => (
          <Text key={d} className="flex-1 text-center text-xs font-rounded-medium" style={{ color: theme.textSecondary }}>{d}</Text>
        ))}
      </View>

      <View className="flex-row flex-wrap mx-4 border rounded-[14px] overflow-hidden" style={{ borderColor: theme.border }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <View key={`empty-${i}`} className="w-[14.28%] aspect-square items-center justify-center p-0.5" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
          const dateKey = formatDateKey(date);
          const entry = entryMap.get(dateKey);
          const past = isPastDate(date);
          const todayDate = isTodayDate(date);
          const future = !past && !todayDate;

          return (
            <TouchableOpacity
              key={day}
              onPress={() => future && !entry ? null : openEditor(date)}
              activeOpacity={future && !entry ? 1 : 0.2}
              className={`w-[14.28%] aspect-square items-center justify-center p-0.5 ${todayDate ? 'rounded-xl' : ''}`}
              style={{
                ...(todayDate ? { backgroundColor: theme.primary + '15' } : {}),
                ...(past && !entry ? { opacity: 0.3 } : {}),
                ...(future && !entry ? { opacity: 0.25 } : {}),
              }}
            >
              <Text
                className={`text-sm font-rounded-medium ${todayDate ? 'font-bold' : ''}`}
                style={{ color: todayDate ? theme.primary : (future && !entry ? theme.textTertiary : theme.textPrimary) }}
              >
                {day}
              </Text>
              {entry && (
                <Text className="text-[10px] absolute bottom-0.5">{moodConfig[entry.mood || 'neutral'].emoji}</Text>
              )}
              {entry && !entry.mood && (
                <View className="w-[5px] h-[5px] rounded-full absolute bottom-[3px]" style={{ backgroundColor: theme.primary }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDate && !showEditor && (
        <View className="mx-4 mt-3 p-4 rounded-[14px] border gap-1.5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>
            {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          {(() => {
            const dateKey = formatDateKey(selectedDate);
            const entry = entryMap.get(dateKey);
            const past = isPastDate(selectedDate);
            if (entry) {
              return (
                <TouchableOpacity onPress={() => openEditor(selectedDate)}>
                  <Text className="text-sm leading-5 font-rounded" style={{ color: theme.textSecondary }} numberOfLines={3}>
                    {entry.mood && moodConfig[entry.mood].emoji + ' '}{entry.content}
                  </Text>
                </TouchableOpacity>
              );
            }
            if (past) {
              return (
                <View className="flex-row items-center gap-1.5 py-2">
                  <Ionicons name="lock-closed-outline" size={16} color={theme.textTertiary} />
                  <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.textTertiary }}>Tidak ada catatan</Text>
                </View>
              );
            }
            return (
              <TouchableOpacity onPress={() => openEditor(selectedDate)} className="flex-row items-center gap-1.5 py-2">
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
                <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.primary }}>Tulis diary</Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      )}

      <Modal visible={showEditor} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowEditor(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable className="flex-1 bg-[rgba(0,0,0,0.4)] justify-end" onPress={() => setShowEditor(false)}>
            <Pressable className="rounded-t-[28px] p-6 gap-4 pb-10" style={{ backgroundColor: theme.surfaceElevated }} onPress={() => {}}>
              <View className="w-9 h-[5px] rounded-full self-center mb-1" style={{ backgroundColor: theme.textTertiary }} />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold font-rounded-bold" style={{ color: theme.textPrimary }}>
                  {selectedDate?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                {!viewOnly && editEntryId && (
                  <TouchableOpacity onPress={() => setDeleteTarget(editEntryId)}>
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                )}
              </View>

              {!viewOnly && (
                <View className="gap-2">
                  <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: theme.textSecondary }}>Bagaimana perasaanmu?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {(Object.entries(moodConfig) as [MoodType, typeof moodConfig[MoodType]][]).map(([key, cfg]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedMood(selectedMood === key ? null : key)}
                        className="flex-row items-center gap-1 py-2 px-3.5 rounded-[20px] border"
                        style={{
                          borderColor: selectedMood === key ? theme.primary : theme.border,
                          ...(selectedMood === key ? { backgroundColor: theme.primary + '15' } : {}),
                        }}
                      >
                        <Text className="text-base">{cfg.emoji}</Text>
                        <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: selectedMood === key ? theme.primary : theme.textSecondary }}>
                          {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {viewOnly ? (
                <View className="min-h-[200px] rounded-[14px] border p-3.5 justify-start items-start gap-2" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                  {selectedMood && (
                    <Text className="text-[28px]">{moodConfig[selectedMood].emoji}</Text>
                  )}
                  <Text className="text-[15px] leading-[22px] font-rounded" style={{ color: theme.textPrimary }}>
                    {content || 'Tidak ada catatan'}
                  </Text>
                </View>
              ) : (
                <TextInput
                  className="min-h-[200px] rounded-[14px] border p-3.5 text-[15px] leading-[22px] font-rounded"
                  style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
                  placeholder="Apa yang terjadi hari ini?"
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                  autoFocus
                />
              )}

              <View className="flex-row gap-3 mt-1">
                {viewOnly ? (
                  <Button title="Tutup" variant="ghost" onPress={() => setShowEditor(false)} style={{ flex: 1 }} />
                ) : (
                  <>
                    <Button title="Batal" variant="ghost" onPress={() => setShowEditor(false)} style={{ flex: 1 }} />
                    <Button title="Simpan" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
                  </>
                )}
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ActionSheet
        visible={!!deleteTarget}
        title="Hapus Diary"
        message="Yakin ingin menghapus catatan ini?"
        options={[
          { text: 'Hapus', style: 'destructive', onPress: handleDelete },
          { text: 'Batal', style: 'cancel' },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
      <ActionSheet
        visible={errorSheet.visible}
        title="Error"
        message={errorSheet.message}
        options={[
          { text: 'OK', style: 'cancel', onPress: () => setErrorSheet({ visible: false, message: '' }) },
        ]}
        onClose={() => setErrorSheet({ visible: false, message: '' })}
      />
    </View>
  );
}
