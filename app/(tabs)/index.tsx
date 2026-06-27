import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  Keyboard, Modal, Pressable, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { Colors } from '@/context/colors';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency, parseFormattedNumber, formatNumber } from '@/utils/formatCurrency';
import { BalanceCard } from '@/components/BalanceCard';
import { Button } from '@/components/Button';
import { SyncButton } from '@/components/SyncButton';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { TransactionRow } from '@/components/TransactionRow';
import { ActionSheet } from '@/components/ActionSheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserName } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, FadeInDown } from 'react-native-reanimated';



const userConfig = {
  Noval: { label: 'Noval', color: '#007AFF', icon: 'man' as const },
  Kharin: { label: 'Kharin', color: '#FF2D55', icon: 'woman' as const },
};

export default function HomeScreen() {
  const theme = useTheme();
  const { state, addTransaction, syncFromSheet, switchUser } = useSavings();
  const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [insufficientAmount, setInsufficientAmount] = useState(0);
  const [errorSheet, setErrorSheet] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const insets = useSafeAreaInsets();
  const headerAnim = useSharedValue(0);
  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: withTiming(0, { duration: 500 })}],
  }));

  const handleAddTransaction = async (type: 'income' | 'expense') => {
    const numAmount = parseFormattedNumber(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorSheet({ visible: true, message: 'Masukkan jumlah yang valid' });
      return;
    }
    if (type === 'expense') {
      if (!note.trim()) {
        setErrorSheet({ visible: true, message: 'Catatan pemakaian wajib diisi' });
        return;
      }
      if (numAmount > state.balance.current) {
        setInsufficientAmount(numAmount);
        setInsufficientBalance(true);
        return;
      }
    }
    setIsSaving(true);
    await addTransaction(type, numAmount, note, state.currentUser);
    setAmount('');
    setNote('');
    setModalType(null);
    Keyboard.dismiss();
    setIsSaving(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setRefreshing(true);
    await syncFromSheet();
    setIsSyncing(false);
    setRefreshing(false);
  };

  const isIncome = modalType === 'income';
  const previewAmount = parseFormattedNumber(amount);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleSync} tintColor={theme.primary} />
        }
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={headerStyle}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View>
              <Text style={[styles.greeting, { color: theme.textPrimary }]}>Tabungan</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Pantau keuanganmu</Text>
            </View>
            <SyncButton onPress={handleSync} isSyncing={isSyncing} lastSynced={state.lastSynced} />
          </View>
        </Animated.View>

        {state.error && (
          <Card style={{ ...styles.errorBanner, backgroundColor: theme.errorLight }} padding="medium">
            <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>{state.error}</Text>
          </Card>
        )}

        <BalanceCard balance={state.balance} />

        <View style={styles.quickActions}>
          <Button
            title="Nabung"
            variant="primary"
            leftIcon={<Ionicons name="add-circle" size={20} color="#FFF" />}
            onPress={() => setModalType('income')}
            style={styles.quickButton}
          />
          <Button
            title="Pakai"
            variant="outline"
            leftIcon={<Ionicons name="remove-circle" size={20} color={theme.primary} />}
            onPress={() => setModalType('expense')}
            style={styles.quickButton}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Transaksi Terbaru</Text>
          {state.transactions.length > 0 && (
            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
              {state.transactions.length} transaksi
            </Text>
          )}
        </View>

        {state.transactions.length === 0 ? (
          <Card style={styles.emptyState} padding="large">
            <Ionicons name="receipt-outline" size={44} color={theme.textTertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Belum ada transaksi</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Mulai nabung atau catat pengeluaran pertama kamu
            </Text>
          </Card>
        ) : (
          <View style={styles.transactionList}>
            {state.transactions.slice(0, 10).map((tx, i) => (
              <Animated.View key={tx.id} entering={FadeInDown.duration(300).delay(i * 40).springify()}>
                <TransactionRow transaction={tx} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!modalType} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setModalType(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalType(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={[styles.modalContent, { backgroundColor: theme.surfaceElevated }]} onPress={() => {}}>
              <View style={[styles.modalHandle, { backgroundColor: theme.textTertiary }]} />
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: isIncome ? '#34C75920' : '#FF3B3020' }]}>
                  <Ionicons name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'} size={28} color={isIncome ? '#34C759' : '#FF3B30'} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {isIncome ? 'Tambah Tabungan' : 'Catat Pemakaian'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Atas nama <Text style={{ color: state.currentUser === 'Noval' ? '#007AFF' : '#FF2D55', fontWeight: '600' }}>{state.currentUser}</Text>
                </Text>
              </View>

              <View style={[styles.amountPreview, { backgroundColor: theme.surface }]}>
                <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Rp</Text>
                <Text style={[styles.amountValue, { color: previewAmount > 0 ? theme.textPrimary : theme.textTertiary }]}>
                  {previewAmount > 0 ? formatNumber(previewAmount) : '0'}
                </Text>
              </View>

              <Input
                label="Jumlah"
                placeholder="0"
                leftIcon="cash-outline"
                formatType="number"
                value={amount}
                onChangeText={setAmount}
              />
              <Input
                label={isIncome ? 'Catatan (opsional)' : 'Catatan'}
                placeholder={isIncome ? 'Gaji bulanan' : 'Belanja'}
                leftIcon="create-outline"
                value={note}
                onChangeText={setNote}
              />
              {!isIncome && previewAmount > 0 && (
                <View style={styles.sisaRow}>
                  <Text style={[styles.sisaLabel, { color: theme.textSecondary }]}>Sisa saldo</Text>
                  <Text style={[styles.sisaValue, { color: previewAmount <= state.balance.current ? theme.textPrimary : theme.error }]}>
                    {formatCurrency(state.balance.current - previewAmount)}
                  </Text>
                </View>
              )}
              <View style={styles.modalUserRow}>
                <Text style={[styles.modalUserLabel, { color: theme.textSecondary }]}>Atas nama</Text>
                <View style={styles.modalUserToggle}>
                  {(['Noval', 'Kharin'] as UserName[]).map((u) => {
                    const cfg = userConfig[u];
                    const isActive = state.currentUser === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => switchUser(u)}
                        style={[
                          styles.modalUserChip,
                          { borderColor: isActive ? cfg.color : theme.border },
                          isActive && { backgroundColor: cfg.color + '15' },
                        ]}
                      >
                        <Ionicons name={cfg.icon} size={14} color={isActive ? cfg.color : theme.textTertiary} />
                        <Text style={[styles.modalUserChipText, { color: isActive ? cfg.color : theme.textTertiary }]}>
                          {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.modalActions}>
                <Button title="Batal" variant="ghost" onPress={() => setModalType(null)} style={styles.modalButton} />
                <Button
                  title={isIncome ? 'Simpan' : 'Simpan'}
                  variant={isIncome ? 'primary' : 'danger'}
                  onPress={() => handleAddTransaction(modalType!)}
                  loading={isSaving}
                  disabled={isSaving}
                  style={styles.modalButton}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <ActionSheet
        visible={insufficientBalance}
        title="Saldo Tidak Cukup"
        message={`Saldo saat ini ${formatCurrency(state.balance.current)}, tidak cukup untuk pengeluaran ${formatCurrency(insufficientAmount)}`}
        options={[
          { text: 'OK', style: 'cancel', onPress: () => setInsufficientBalance(false) },
        ]}
        onClose={() => setInsufficientBalance(false)}
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
    fontFamily: 'SFProRounded-Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'SFProRounded-Medium',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: 'SFProRounded-Regular',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 16,
  },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'SFProRounded-Regular',
  },
  transactionList: { gap: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
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
    fontSize: 13,
    fontFamily: 'SFProRounded-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  amountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  amountLabel: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
  },
  sisaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sisaLabel: {
    fontSize: 13,
    fontFamily: 'SFProRounded-Regular',
  },
  sisaValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  modalUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalUserLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  modalUserToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  modalUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalUserChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: { flex: 1 },
});
