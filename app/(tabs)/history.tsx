import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { startOfDay } from 'date-fns';
import { TransactionRow } from '@/components/TransactionRow';
import { Card } from '@/components/Card';
import { ActionSheet } from '@/components/ActionSheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserName, Transaction } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';


const userColors: Record<string, string> = {
  all: '#8E8E93',
  Noval: '#007AFF',
  Kharin: '#FF2D55',
};

type FilterType = 'all' | 'income' | 'expense';
type UserFilter = 'all' | UserName;

const filterItems: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Semua', icon: 'list-outline' },
  { key: 'income', label: 'Masuk', icon: 'arrow-down-circle-outline' },
  { key: 'expense', label: 'Keluar', icon: 'arrow-up-circle-outline' },
];

export default function HistoryScreen() {
  const theme = useTheme();
  const { state, deleteTransaction } = useSavings();
  const [filter, setFilter] = useState<FilterType>('all');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');

  const insets = useSafeAreaInsets();
  const [txSheetTx, setTxSheetTx] = useState<Transaction | null>(null);
  const [deleteSheetTx, setDeleteSheetTx] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    let result = state.transactions;
    if (filter !== 'all') {
      result = result.filter(t => t.type === filter);
    }
    if (userFilter !== 'all') {
      result = result.filter(t => t.user === userFilter);
    }
    return result;
  }, [state.transactions, filter, userFilter]);

  const totals = useMemo(() => {
    const income = state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayStart = startOfDay(new Date()).getTime();
    const todayIncome = state.transactions
      .filter(t => t.type === 'income' && new Date(t.date).getTime() >= todayStart)
      .reduce((sum, t) => sum + t.amount, 0);
    const todayExpense = state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getTime() >= todayStart)
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, net: income - expense, todayIncome, todayExpense };
  }, [state.transactions]);

  const handlePress = useCallback((tx: Transaction) => {
    setTxSheetTx(tx);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Riwayat</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {state.transactions.length} transaksi
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceElevated }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-down-circle" size={16} color="#34C759" />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Masuk Hari Ini</Text>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>{formatCurrency(totals.todayIncome)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-up-circle" size={16} color="#FF3B30" />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Keluar Hari Ini</Text>
              <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>{formatCurrency(totals.todayExpense)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="wallet-outline" size={16} color={theme.textPrimary} />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Saldo</Text>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{formatCurrency(totals.net)}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filterItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  filter === item.key && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
              >
                <Ionicons name={item.icon} size={14} color={filter === item.key ? theme.primary : theme.textSecondary} />
                <Text style={[styles.filterChipText, { color: filter === item.key ? theme.primary : theme.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ width: 8 }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {(['all', 'Noval', 'Kharin'] as UserFilter[]).map((u) => {
              const isActive = userFilter === u;
              const color = u === 'all' ? theme.textSecondary : userColors[u];
              return (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUserFilter(u)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isActive && { backgroundColor: color + '15', borderColor: color },
                  ]}
                >
                  {u !== 'all' && <Ionicons name={u === 'Noval' ? 'man' : 'woman'} size={14} color={isActive ? color : theme.textTertiary} />}
                  <Text style={[styles.filterChipText, { color: isActive ? color : theme.textSecondary }]}>
                    {u === 'all' ? 'Semua' : u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ScrollView>

        {filteredTransactions.length === 0 ? (
          <Card style={styles.emptyState} padding="large">
            <Ionicons name="receipt-outline" size={44} color={theme.textTertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Tidak ada transaksi</Text>
          </Card>
        ) : (
          <View style={styles.transactionList}>
            {filteredTransactions.length > 0 && (
              <Text style={[styles.transactionCount, { color: theme.textSecondary }]}>
                {filteredTransactions.length} transaksi
              </Text>
            )}
            {filteredTransactions.map((tx, i) => (
              <Animated.View key={tx.id} entering={FadeInDown.duration(300).delay(i * 30).springify()}>
                <TransactionRow
                  transaction={tx}
                  onPress={() => handlePress(tx)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <ActionSheet
        visible={!!txSheetTx}
        title="Opsi Transaksi"
        message={`${txSheetTx?.note || (txSheetTx?.type === 'income' ? 'Pemasukan' : 'Pengeluaran')} — ${formatCurrency(txSheetTx?.amount || 0)}`}
        options={[
          { text: 'Batal', style: 'cancel', onPress: () => setTxSheetTx(null) },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: () => {
              setDeleteSheetTx(txSheetTx);
              setTxSheetTx(null);
            },
          },
        ]}
        onClose={() => setTxSheetTx(null)}
      />
      <ActionSheet
        visible={!!deleteSheetTx}
        title="Hapus Transaksi"
        message={`Hapus ${deleteSheetTx?.type === 'income' ? 'pemasukan' : 'pengeluaran'} ${formatCurrency(deleteSheetTx?.amount || 0)} oleh ${deleteSheetTx?.user}?`}
        options={[
          { text: 'Batal', style: 'cancel', onPress: () => setDeleteSheetTx(null) },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: () => {
              if (deleteSheetTx) deleteTransaction(deleteSheetTx.id).catch(() => {});
              setDeleteSheetTx(null);
            },
          },
        ]}
        onClose={() => setDeleteSheetTx(null)}
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
  summaryCard: {
    borderRadius: 20,
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'SFProRounded-Medium',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'column',
    gap: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SFProRounded-Medium',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
  },
  transactionList: { gap: 6 },
  transactionCount: {
    fontSize: 12,
    fontFamily: 'SFProRounded-Regular',
  },
});
