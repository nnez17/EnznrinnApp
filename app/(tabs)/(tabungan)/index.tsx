import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  Keyboard, Modal, Pressable, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
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
import { router } from 'expo-router';



const userConfig = {
  Noval: { label: 'Noval', color: '#007AFF', icon: 'man' as const },
  Kharin: { label: 'Kharin', color: '#FF2D55', icon: 'woman' as const },
};

export default function DashboardScreen() {
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

  useEffect(() => {
    syncFromSheet();
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
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleSync} tintColor={theme.primary} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={headerStyle}>
          <View className="flex-row justify-between items-start" style={{ paddingTop: insets.top + 12 }}>
            <View>
              <Text className="text-[30px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Tabungan</Text>
              <Text className="text-[15px] mt-0.5 font-rounded" style={{ color: theme.textSecondary }}>Pantau keuanganmu</Text>
            </View>
            <SyncButton onPress={handleSync} isSyncing={isSyncing} lastSynced={state.lastSynced} />
          </View>
        </Animated.View>

        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(tabungan)/riwayat')}
            className="flex-row items-center gap-1.5 py-2.5 px-4 rounded-xl border flex-1 justify-center"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <Ionicons name="time-outline" size={18} color={theme.primary} />
            <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>Riwayat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(tabungan)/target')}
            className="flex-row items-center gap-1.5 py-2.5 px-4 rounded-xl border flex-1 justify-center"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <Ionicons name="flag-outline" size={18} color={theme.primary} />
            <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>Target</Text>
          </TouchableOpacity>
        </View>

        {state.error && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.errorLight }} padding="medium">
            <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
            <Text className="flex-1 text-[13px] font-rounded-medium" style={{ color: theme.error }}>{state.error}</Text>
          </Card>
        )}

        <BalanceCard balance={state.balance} />

        <View className="flex-row gap-3">
          <Button
            title="Nabung"
            variant="primary"
            leftIcon={<Ionicons name="add-circle" size={20} color="#FFF" />}
            onPress={() => setModalType('income')}
            style={{ flex: 1 }}
          />
          <Button
            title="Pakai"
            variant="outline"
            leftIcon={<Ionicons name="remove-circle" size={20} color={theme.primary} />}
            onPress={() => setModalType('expense')}
            style={{ flex: 1 }}
          />
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-lg font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>Transaksi Terbaru</Text>
          {state.transactions.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/(tabungan)/riwayat')}>
              <Text className="text-[13px] font-rounded" style={{ color: theme.primary }}>
                Lihat semua
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {state.transactions.length === 0 ? (
          <Card style={{ alignItems: 'center', marginTop: 16 }} padding="large">
            <Ionicons name="receipt-outline" size={44} color={theme.textTertiary} style={{ marginBottom: 12 }} />
            <Text className="text-base font-semibold font-rounded-semibold mb-1" style={{ color: theme.textPrimary }}>Belum ada transaksi</Text>
            <Text className="text-sm text-center font-rounded" style={{ color: theme.textSecondary }}>
              Mulai nabung atau catat pengeluaran pertama kamu
            </Text>
          </Card>
        ) : (
          <View className="gap-2">
            {state.transactions.slice(0, 10).map((tx, i) => (
              <Animated.View key={tx.id} entering={FadeInDown.duration(300).delay(i * 40).springify()}>
                <TransactionRow transaction={tx} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!modalType} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1 bg-[rgba(0,0,0,0.4)] justify-end" onPress={() => setModalType(null)}>
            <Pressable className="rounded-t-[28px] p-6 gap-3.5 pb-10" style={{ backgroundColor: theme.surfaceElevated }} onPress={() => {}}>
              <View className="w-9 h-[5px] rounded-full self-center mb-1" style={{ backgroundColor: theme.textTertiary }} />
              <View className="items-center mb-1">
                <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: isIncome ? '#34C75920' : '#FF3B3020' }}>
                  <Ionicons name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'} size={28} color={isIncome ? '#34C759' : '#FF3B30'} />
                </View>
                <Text className="text-xl font-bold font-rounded-bold text-center" style={{ color: theme.textPrimary }}>
                  {isIncome ? 'Tambah Tabungan' : 'Catat Pemakaian'}
                </Text>
                <Text className="text-[13px] font-rounded text-center mt-1" style={{ color: theme.textSecondary }}>
                  Atas nama <Text style={{ color: state.currentUser === 'Noval' ? '#007AFF' : '#FF2D55', fontWeight: '600' }}>{state.currentUser}</Text>
                </Text>
              </View>

              <View className="flex-row items-center justify-center gap-1.5 py-3.5 rounded-[14px]" style={{ backgroundColor: theme.surface }}>
                <Text className="text-2xl font-semibold font-rounded-semibold" style={{ color: theme.textSecondary }}>Rp</Text>
                <Text className="text-[28px] font-bold font-rounded-bold" style={{ color: previewAmount > 0 ? theme.textPrimary : theme.textTertiary }}>
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
                <View className="flex-row items-center justify-between px-1">
                  <Text className="text-[13px] font-rounded" style={{ color: theme.textSecondary }}>Sisa saldo</Text>
                  <Text className="text-[15px] font-semibold font-rounded-semibold" style={{ color: previewAmount <= state.balance.current ? theme.textPrimary : theme.error }}>
                    {formatCurrency(state.balance.current - previewAmount)}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: theme.textSecondary }}>Atas nama</Text>
                <View className="flex-row gap-2">
                  {(['Noval', 'Kharin'] as UserName[]).map((u) => {
                    const cfg = userConfig[u];
                    const isActive = state.currentUser === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => switchUser(u)}
                        className="flex-row items-center gap-1 py-1.5 px-3 rounded-2xl border"
                        style={{
                          borderColor: isActive ? cfg.color : theme.border,
                          ...(isActive ? { backgroundColor: cfg.color + '15' } : {}),
                        }}
                      >
                        <Ionicons name={cfg.icon} size={14} color={isActive ? cfg.color : theme.textTertiary} />
                        <Text className="text-xs font-semibold font-rounded-semibold" style={{ color: isActive ? cfg.color : theme.textTertiary }}>
                          {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View className="flex-row gap-3 mt-2">
                <Button title="Batal" variant="ghost" onPress={() => setModalType(null)} style={{ flex: 1 }} />
                <Button
                  title={isIncome ? 'Simpan' : 'Simpan'}
                  variant={isIncome ? 'primary' : 'danger'}
                  onPress={() => handleAddTransaction(modalType!)}
                  loading={isSaving}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
