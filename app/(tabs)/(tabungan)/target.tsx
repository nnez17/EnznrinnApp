import React, { useState } from 'react';
import {
  View, Text, ScrollView,
  Modal, Pressable, KeyboardAvoidingView, Platform,
  TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency, parseFormattedNumber } from '@/utils/formatCurrency';
import { getDaysUntil } from '@/utils/dateUtils';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TargetProgress } from '@/components/TargetProgress';
import { ActionSheet } from '@/components/ActionSheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function isValidDeadline(date: Date): boolean {
  const tomorrow = getTomorrow();
  return date.getTime() >= tomorrow.getTime();
}


export default function TargetScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, setTarget: setTargetToSheet, updateTarget, deleteTargetFromSheet } = useSavings();
  const target = state.target;

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [errorSheet, setErrorSheet] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const daysLeft = target ? getDaysUntil(target.deadline) : 0;
  const completed = target ? state.balance.current >= target.targetAmount : false;
  const overdue = target ? daysLeft < 0 && !completed : false;
  const dailyNeeded = target && daysLeft > 0
    ? Math.ceil(Math.max(target.targetAmount - state.balance.current, 0) / daysLeft)
    : 0;

  const openCreateModal = () => {
    setEditMode(false);
    setTargetAmount('');
    setSelectedDate(null);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!target) return;
    setEditMode(true);
    setTargetAmount(target.targetAmount.toString());
    setSelectedDate(new Date(target.deadline));
    setShowModal(true);
  };

  const handleSetTarget = async () => {
    const amount = parseFormattedNumber(targetAmount);
    if (!amount || amount <= 0) {
      setErrorSheet({ visible: true, message: 'Masukkan target yang valid' });
      return;
    }
    if (!selectedDate) {
      setErrorSheet({ visible: true, message: 'Pilih batas waktu' });
      return;
    }
    if (!isValidDeadline(selectedDate)) {
      setErrorSheet({ visible: true, message: 'Batas waktu harus minimal besok' });
      return;
    }

    try {
      const deadlineISO = selectedDate!.toISOString();
      if (editMode) {
        await updateTarget({ targetAmount: amount, deadline: deadlineISO });
      } else {
        await setTargetToSheet(amount, deadlineISO);
      }
      setShowModal(false);
      setTargetAmount('');
      setSelectedDate(null);
    } catch (e) {
      setErrorSheet({ visible: true, message: e instanceof Error ? e.message : 'Gagal menyimpan target' });
    }
  };

  const handleClearTarget = () => {
    setShowDeleteSheet(true);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 12 }}>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full items-center justify-center">
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <View>
              <Text className="text-[26px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Target</Text>
              <Text className="text-sm mt-0.5 font-rounded" style={{ color: theme.textSecondary }}>{target ? 'Progress tabunganmu' : 'Buat target tabungan'}</Text>
            </View>
          </View>
        </View>

        {target ? (
          <>
            <TargetProgress target={target} currentBalance={state.balance.current} />

            <Card padding="medium">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
                  <Ionicons
                    name={completed ? 'checkmark-circle' : overdue ? 'alert-circle' : 'information-circle'}
                    size={22}
                    color={completed ? theme.success : overdue ? theme.error : theme.primary}
                  />
                </View>
                <Text className="flex-1 text-sm leading-5 font-rounded" style={{ color: theme.textSecondary }}>{completed
                    ? 'Selamat! Kamu sudah mencapai target tabungan.'
                    : overdue
                      ? 'Target belum tercapai dan sudah melewati batas waktu.'
                      : `Kamu perlu menabung ${formatCurrency(dailyNeeded)} per hari untuk mencapai target.`}
                </Text>
              </View>
            </Card>

            <View className="gap-3">
              <Button
                title="Edit Target"
                variant="secondary"
                onPress={openEditModal}
                leftIcon={<Ionicons name="create-outline" size={20} color={theme.primary} />}
              />
              <Button
                title="Hapus Target"
                variant="danger"
                onPress={handleClearTarget}
                leftIcon={<Ionicons name="trash-outline" size={20} color="#FFF" />}
              />
            </View>
          </>
        ) : (
          <Card style={{ alignItems: 'center', marginTop: 32 }} padding="large">
            <View className="w-[72px] h-[72px] rounded-full items-center justify-center mb-4" style={{ backgroundColor: theme.primaryLight }}>
              <Ionicons name="flag-outline" size={36} color={theme.primary} />
            </View>
            <Text className="text-lg font-semibold font-rounded-semibold mb-2" style={{ color: theme.textPrimary }}>Belum ada target</Text>
            <Text className="text-sm text-center font-rounded mb-6 leading-5" style={{ color: theme.textSecondary }}>Buat target tabungan untuk membantumu menabung lebih disiplin</Text>
            <Button
              title="Buat Target Baru"
              variant="primary"
              onPress={openCreateModal}
              leftIcon={<Ionicons name="add-circle" size={20} color="#FFF" />}
              style={{ width: '100%' }}
            />
          </Card>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1 bg-[rgba(0,0,0,0.4)] justify-end" onPress={() => setShowModal(false)}>
            <Pressable className="rounded-t-[28px] p-6 gap-4 pb-10" style={{ backgroundColor: theme.surfaceElevated }} onPress={() => {}}>
              <View className="w-9 h-[5px] rounded-full self-center mb-1" style={{ backgroundColor: theme.textTertiary }} />
              <View className="items-center mb-1">
                <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: theme.primaryLight }}>
                  <Ionicons name="flag" size={28} color={theme.primary} />
                </View>
                <Text className="text-xl font-bold font-rounded-bold text-center" style={{ color: theme.textPrimary }}>{editMode ? 'Edit Target' : 'Target Baru'}</Text>
                <Text className="text-sm font-rounded text-center mt-1" style={{ color: theme.textSecondary }}>{editMode ? 'Ubah target dan batas waktu' : 'Tentukan target dan batas waktu'}</Text>
              </View>
              <Input
                label="Jumlah Target"
                placeholder="1.000.000"
                leftIcon="cash-outline"
                formatType="number"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  className="flex-row items-center gap-2.5 py-3.5 px-4 rounded-[14px] border"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                  <Text className="flex-1 text-[15px] font-rounded-medium" style={{ color: selectedDate ? theme.textPrimary : theme.textTertiary }}>
                    {selectedDate ? formatDate(selectedDate) : 'Pilih batas waktu'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textTertiary} />
                </TouchableOpacity>

                {showCalendar && (
                  <View className="rounded-[14px] border p-3 gap-2" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <View className="flex-row items-center justify-between px-1">
                      <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                        <Ionicons name="chevron-back" size={20} color={theme.primary} />
                      </TouchableOpacity>
                      <Text className="text-[15px] font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>
                        {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-around">
                      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                        <Text key={d} className="text-[11px] font-rounded-medium w-9 text-center" style={{ color: theme.textSecondary }}>{d}</Text>
                      ))}
                    </View>

                    <View className="flex-row flex-wrap">
                      {(() => {
                        const year = calendarMonth.getFullYear();
                        const month = calendarMonth.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const cells: React.ReactNode[] = [];

                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<View key={`empty-${i}`} className="w-9 h-9 items-center justify-center" />);
                        }

                        for (let d = 1; d <= daysInMonth; d++) {
                          const date = new Date(year, month, d);
                          const isPast = date.getTime() <= today.getTime();
                          const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
                          cells.push(
                            <TouchableOpacity
                              key={d}
                              disabled={isPast}
                              onPress={() => {
                                setSelectedDate(date);
                                setShowCalendar(false);
                              }}
                              className={`w-9 h-9 items-center justify-center ${isSelected ? 'rounded-lg' : ''}`}
                              style={{
                                ...(isSelected ? { backgroundColor: theme.primary } : {}),
                                ...(isPast ? { opacity: 0.2 } : {}),
                              }}
                            >
                              <Text className="text-sm font-rounded-medium" style={{ color: isSelected ? '#FFF' : theme.textPrimary }}>
                                {d}
                              </Text>
                            </TouchableOpacity>,
                          );
                        }

                        return cells;
                      })()}
                    </View>
                  </View>
                )}
              </View>
              <View className="flex-row gap-3 mt-2">
                <Button title="Batal" variant="ghost" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                <Button title="Simpan" variant="primary" onPress={handleSetTarget} style={{ flex: 1 }} />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ActionSheet
        visible={showDeleteSheet}
        title="Hapus Target"
        message="Yakin ingin menghapus target?"
        options={[
          { text: 'Hapus', style: 'destructive', onPress: () => deleteTargetFromSheet().catch(() => {}) },
          { text: 'Batal', style: 'cancel' },
        ]}
        onClose={() => setShowDeleteSheet(false)}
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
