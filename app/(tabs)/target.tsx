import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Target</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{target ? 'Progress tabunganmu' : 'Buat target tabungan'}</Text>
        </View>

        {target ? (
          <>
            <TargetProgress target={target} currentBalance={state.balance.current} />

            <Card style={styles.infoCard} padding="medium">
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons
                    name={completed ? 'checkmark-circle' : overdue ? 'alert-circle' : 'information-circle'}
                    size={22}
                    color={completed ? theme.success : overdue ? theme.error : theme.primary}
                  />
                </View>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>{completed
                    ? 'Selamat! Kamu sudah mencapai target tabungan.'
                    : overdue
                      ? 'Target belum tercapai dan sudah melewati batas waktu.'
                      : `Kamu perlu menabung ${formatCurrency(dailyNeeded)} per hari untuk mencapai target.`}
                </Text>
              </View>
            </Card>

            <View style={styles.actions}>
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
          <Card style={styles.emptyState} padding="large">
            <View style={[styles.emptyIconWrapper, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="flag-outline" size={36} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Belum ada target</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Buat target tabungan untuk membantumu menabung lebih disiplin</Text>
            <Button
              title="Buat Target Baru"
              variant="primary"
              onPress={openCreateModal}
              leftIcon={<Ionicons name="add-circle" size={20} color="#FFF" />}
              style={styles.createButton}
            />
          </Card>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={[styles.modalContent, { backgroundColor: theme.surfaceElevated }]} onPress={() => {}}>
              <View style={[styles.modalHandle, { backgroundColor: theme.textTertiary }]} />
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="flag" size={28} color={theme.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{editMode ? 'Edit Target' : 'Target Baru'}</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{editMode ? 'Ubah target dan batas waktu' : 'Tentukan target dan batas waktu'}</Text>
              </View>
              <Input
                label="Jumlah Target"
                placeholder="1.000.000"
                leftIcon="cash-outline"
                formatType="number"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                  <Text style={[styles.dateText, { color: selectedDate ? theme.textPrimary : theme.textTertiary }]}>
                    {selectedDate ? formatDate(selectedDate) : 'Pilih batas waktu'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textTertiary} />
                </TouchableOpacity>

                {showCalendar && (
                  <View style={[styles.calendar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.calHeader}>
                      <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                        <Ionicons name="chevron-back" size={20} color={theme.primary} />
                      </TouchableOpacity>
                      <Text style={[styles.calTitle, { color: theme.textPrimary }]}>
                        {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.calWeekdays}>
                      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                        <Text key={d} style={[styles.calWeekday, { color: theme.textSecondary }]}>{d}</Text>
                      ))}
                    </View>

                    <View style={styles.calGrid}>
                      {(() => {
                        const year = calendarMonth.getFullYear();
                        const month = calendarMonth.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const cells: React.ReactNode[] = [];

                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<View key={`empty-${i}`} style={styles.calDay} />);
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
                              style={[
                                styles.calDay,
                                isSelected && { backgroundColor: theme.primary, borderRadius: 8 },
                                isPast && { opacity: 0.2 },
                              ]}
                            >
                              <Text style={[styles.calDayText, { color: isSelected ? '#FFF' : theme.textPrimary }]}>
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
              <View style={styles.modalActions}>
                <Button title="Batal" variant="ghost" onPress={() => setShowModal(false)} style={styles.modalButton} />
                <Button title="Simpan" variant="primary" onPress={handleSetTarget} style={styles.modalButton} />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {},
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'SFProRounded-Regular',
  },
  infoCard: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'SFProRounded-Regular',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'SFProRounded-Regular',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'SFProRounded-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SFProRounded-Medium',
  },
  calendar: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  calTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  calWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calWeekday: {
    fontSize: 11,
    fontFamily: 'SFProRounded-Medium',
    width: 36,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDay: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayText: {
    fontSize: 14,
    fontFamily: 'SFProRounded-Medium',
  },
});
