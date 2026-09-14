import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { ActionSheet } from '@/components/ActionSheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

type FilterType = 'all' | 'income' | 'expense';
type FilterUser = 'all' | 'Noval' | 'Kharin';

export default function RiwayatScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, deleteTransaction } = useSavings();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterUser, setFilterUser] = useState<FilterUser>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = state.transactions;
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterUser !== 'all') list = list.filter(t => t.user === filterUser);
    return list;
  }, [state.transactions, filterType, filterUser]);

  const todayIncome = useMemo(
    () => state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );
  const todayExpense = useMemo(
    () => state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget);
    } catch {}
    setDeleteTarget(null);
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Masuk', value: 'income' },
    { label: 'Keluar', value: 'expense' },
  ];

  const userFilters: { label: string; value: FilterUser }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Noval', value: 'Noval' },
    { label: 'Kharin', value: 'Kharin' },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="flex-row items-center px-4 pb-2 gap-2" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[26px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Riwayat</Text>
          <Text className="text-sm mt-0.5 font-rounded" style={{ color: theme.textSecondary }}>Semua transaksi</Text>
        </View>
      </View>

      <Card style={{ marginHorizontal: 16, marginBottom: 4 }} padding="medium">
        <View className="flex-row items-center">
          <View className="flex-1 items-center gap-1">
            <Text className="text-xs font-rounded" style={{ color: theme.textSecondary }}>Pemasukan</Text>
            <Text className="text-base font-bold font-rounded-bold" style={{ color: theme.success }}>{formatCurrency(todayIncome)}</Text>
          </View>
          <View className="w-px h-8" style={{ backgroundColor: theme.separator }} />
          <View className="flex-1 items-center gap-1">
            <Text className="text-xs font-rounded" style={{ color: theme.textSecondary }}>Pengeluaran</Text>
            <Text className="text-base font-bold font-rounded-bold" style={{ color: theme.error }}>{formatCurrency(todayExpense)}</Text>
          </View>
          <View className="w-px h-8" style={{ backgroundColor: theme.separator }} />
          <View className="flex-1 items-center gap-1">
            <Text className="text-xs font-rounded" style={{ color: theme.textSecondary }}>Saldo</Text>
            <Text className="text-base font-bold font-rounded-bold" style={{ color: theme.textPrimary }}>{formatCurrency(todayIncome - todayExpense)}</Text>
          </View>
        </View>
      </Card>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-11 my-2"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
        {filters.map(f => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilterType(f.value)}
            className="py-1.5 px-3.5 rounded-2xl border"
            style={{
              borderColor: filterType === f.value ? theme.primary : theme.border,
              ...(filterType === f.value ? { backgroundColor: theme.primary + '15' } : {}),
            }}
          >
            <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: filterType === f.value ? theme.primary : theme.textSecondary }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="w-px h-5" style={{ backgroundColor: theme.separator }} />
        {userFilters.map(f => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilterUser(f.value)}
            className="py-1.5 px-3.5 rounded-2xl border"
            style={{
              borderColor: filterUser === f.value ? theme.primary : theme.border,
              ...(filterUser === f.value ? { backgroundColor: theme.primary + '15' } : {}),
            }}
          >
            <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: filterUser === f.value ? theme.primary : theme.textSecondary }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View className="items-center mt-[60px] gap-2">
            <Ionicons name="search-outline" size={44} color={theme.textTertiary} />
            <Text className="text-sm font-rounded" style={{ color: theme.textSecondary }}>Tidak ada transaksi</Text>
          </View>
        ) : (
          filtered.map((tx, i) => (
            <Animated.View key={tx.id} entering={FadeInDown.duration(300).delay(i * 30).springify()}>
              <TouchableOpacity
                onLongPress={() => setDeleteTarget(tx.id)}
                delayLongPress={500}
              >
                <TransactionRow transaction={tx} />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <ActionSheet
        visible={!!deleteTarget}
        title="Hapus Transaksi"
        message="Yakin ingin menghapus transaksi ini?"
        options={[
          { text: 'Hapus', style: 'destructive', onPress: handleDelete },
          { text: 'Batal', style: 'cancel' },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}
