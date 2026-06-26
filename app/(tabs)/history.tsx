import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { Colors } from '@/context/colors';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency, parseFormattedNumber } from '@/utils/formatCurrency';
import { TransactionRow } from '@/components/TransactionRow';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserName, Transaction } from '@/types';
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
  const { state, deleteTransaction, updateTransaction } = useSavings();
  const [filter, setFilter] = useState<FilterType>('all');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editUser, setEditUser] = useState<UserName>('Noval');
  const [isSaving, setIsSaving] = useState(false);

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
    return { income, expense, net: income - expense };
  }, [state.transactions]);

  const handlePress = useCallback((tx: Transaction) => {
    Alert.alert('Opsi Transaksi', `${tx.note || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')} — ${formatCurrency(tx.amount)}`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => {
          setEditTx(tx);
          setEditAmount(tx.amount.toString());
          setEditNote(tx.note);
          setEditUser(tx.user || 'Noval');
        },
      },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Hapus Transaksi',
            `Hapus ${tx.type === 'income' ? 'pemasukan' : 'pengeluaran'} ${formatCurrency(tx.amount)} oleh ${tx.user}?`,
            [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Hapus',
                style: 'destructive',
                onPress: () => deleteTransaction(tx.id).catch(() => {}),
              },
            ],
          );
        },
      },
    ]);
  }, [deleteTransaction]);

  const handleSaveEdit = async () => {
    if (!editTx) return;
    const numAmount = parseFormattedNumber(editAmount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }
    try {
      setIsSaving(true);
      await updateTransaction(editTx.id, { amount: numAmount, note: editNote, user: editUser });
      setEditTx(null);
      setEditAmount('');
      setEditNote('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Gagal mengupdate transaksi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Riwayat</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {state.transactions.length} transaksi
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceElevated }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-down-circle" size={16} color="#34C759" />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Masuk</Text>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>{formatCurrency(totals.income)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-up-circle" size={16} color="#FF3B30" />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Keluar</Text>
              <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>{formatCurrency(totals.expense)}</Text>
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

      <Modal visible={!!editTx} transparent animationType="slide" onRequestClose={() => setEditTx(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditTx(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={[styles.modalContent, { backgroundColor: theme.surfaceElevated }]} onPress={() => {}}>
              <View style={[styles.modalHandle, { backgroundColor: theme.textTertiary }]} />
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="create-outline" size={28} color={theme.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Transaksi</Text>
              </View>

              <Input
                label="Jumlah"
                placeholder="0"
                leftIcon="cash-outline"
                formatType="number"
                value={editAmount}
                onChangeText={setEditAmount}
              />
              <Input
                label="Catatan"
                placeholder="Deskripsi"
                leftIcon="create-outline"
                value={editNote}
                onChangeText={setEditNote}
              />
              <View style={styles.modalUserRow}>
                <Text style={[styles.modalUserLabel, { color: theme.textSecondary }]}>Atas nama</Text>
                <View style={styles.modalUserToggle}>
                  {(['Noval', 'Kharin'] as UserName[]).map((u) => {
                    const isActive = editUser === u;
                    const color = u === 'Noval' ? '#007AFF' : '#FF2D55';
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setEditUser(u)}
                        style={[
                          styles.modalUserChip,
                          { borderColor: isActive ? color : theme.border },
                          isActive && { backgroundColor: color + '15' },
                        ]}
                      >
                        <Ionicons name={u === 'Noval' ? 'man' : 'woman'} size={14} color={isActive ? color : theme.textTertiary} />
                        <Text style={[styles.modalUserChipText, { color: isActive ? color : theme.textTertiary }]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.modalActions}>
                <Button title="Batal" variant="ghost" onPress={() => setEditTx(null)} style={styles.modalButton} />
                <Button title="Simpan" variant="primary" onPress={handleSaveEdit} loading={isSaving} disabled={isSaving} style={styles.modalButton} />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
    paddingTop: 8,
  },
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
