import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView,
  Modal, Pressable, KeyboardAvoidingView, Platform,
  TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency, parseFormattedNumber } from '@/utils/formatCurrency';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ActionSheet } from '@/components/ActionSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Priority, UserName } from '@/types';

const priorityConfig: Record<Priority, { label: string; color: string; icon: string }> = {
  low: { label: 'Rendah', color: '#34C759', icon: 'arrow-down' },
  medium: { label: 'Sedang', color: '#FF9500', icon: 'remove-circle' },
  high: { label: 'Tinggi', color: '#FF3B30', icon: 'arrow-up' },
};

const userConfig = {
  Noval: { label: 'Noval', color: '#007AFF', icon: 'man' as const },
  Kharin: { label: 'Kharin', color: '#FF2D55', icon: 'woman' as const },
};

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, loadWishlist, addWishlistItem, toggleWishlistItem, deleteWishlistItem } = useSavings();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');
  const [filterUser, setFilterUser] = useState<UserName | 'all'>('all');
  const [wishlistUser, setWishlistUser] = useState<UserName>(state.currentUser);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [errorSheet, setErrorSheet] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  useEffect(() => {
    loadWishlist();
  }, []);

  const filtered = useMemo(() => {
    let list = state.wishlist;
    if (filterUser !== 'all') list = list.filter(w => w.user === filterUser);
    return list;
  }, [state.wishlist, filterUser]);

  const handleAdd = async () => {
    if (!name.trim()) {
      setErrorSheet({ visible: true, message: 'Nama wishlist wajib diisi' });
      return;
    }
    const numPrice = price ? parseFormattedNumber(price) : undefined;
    if (price && (!numPrice || numPrice <= 0)) {
      setErrorSheet({ visible: true, message: 'Masukkan budget yang valid' });
      return;
    }
    try {
      await addWishlistItem(name.trim(), numPrice, priority, notes.trim() || undefined, wishlistUser);
    } catch (e) {
      setErrorSheet({ visible: true, message: e instanceof Error ? e.message : 'Gagal menyimpan' });
      return;
    }
    setName('');
    setPrice('');
    setPriority('medium');
    setNotes('');
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWishlistItem(deleteTarget);
    } catch (e) {
      setErrorSheet({ visible: true, message: e instanceof Error ? e.message : 'Gagal menghapus' });
      return;
    }
    setDeleteTarget(null);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="flex-row justify-between items-start px-4 pb-2" style={{ paddingTop: insets.top + 12 }}>
        <View>
          <Text className="text-[30px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Wishlist</Text>
          <Text className="text-[15px] mt-0.5 font-rounded" style={{ color: theme.textSecondary }}>Impian dan aktivitas bersama</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} className="w-10 h-10 rounded-full items-center justify-center mt-1" style={{ backgroundColor: theme.primary }}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-11 mb-1" contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {(['all', 'Noval', 'Kharin'] as const).map(u => (
          <TouchableOpacity
            key={u}
            onPress={() => setFilterUser(u)}
            className="flex-row items-center gap-1 py-1.5 px-3.5 rounded-2xl border"
            style={{
              borderColor: filterUser === u ? theme.primary : theme.border,
              ...(filterUser === u ? { backgroundColor: theme.primary + '15' } : {}),
            }}
          >
            {u !== 'all' && <Ionicons name={u === 'Noval' ? 'man' : 'woman'} size={14} color={filterUser === u ? theme.primary : theme.textTertiary} />}
            <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: filterUser === u ? theme.primary : theme.textSecondary }}>
              {u === 'all' ? 'Semua' : u}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View className="items-center mt-[60px] gap-2">
            <View className="w-[72px] h-[72px] rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.primaryLight }}>
              <Ionicons name="sparkles-outline" size={40} color={theme.primary} />
            </View>
            <Text className="text-base font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>Belum ada wishlist</Text>
            <Text className="text-sm text-center font-rounded" style={{ color: theme.textSecondary }}>Tambahkan aktivitas atau impian bersama</Text>
          </View>
        ) : (
          filtered.map(item => {
            const prio = priorityConfig[item.priority];
            return (
              <View key={item.id} className="flex-row items-start gap-2.5 p-4 rounded-2xl border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <TouchableOpacity onPress={() => toggleWishlistItem(item.id)} className="p-1">
                  <View className="w-6 h-6 rounded-full border-2 items-center justify-center" style={{
                    borderColor: item.isAchieved ? theme.success : theme.border,
                    backgroundColor: item.isAchieved ? theme.success : 'transparent',
                  }}>
                    {item.isAchieved && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleWishlistItem(item.id)} className="flex-1 gap-0.5">
                  <Text className={`text-base font-semibold font-rounded-semibold ${item.isAchieved ? 'line-through' : ''} flex-1`} style={{ color: item.isAchieved ? theme.textTertiary : theme.textPrimary }}>
                    {item.name}
                  </Text>
                  {item.price !== undefined && (
                    <Text className="text-[15px] font-bold font-rounded-bold mt-0.5" style={{ color: item.isAchieved ? theme.textTertiary : theme.textPrimary }}>
                      {formatCurrency(item.price)}
                    </Text>
                  )}
                  {item.notes && (
                    <Text className="text-xs font-rounded mt-0.5" style={{ color: theme.textSecondary }} numberOfLines={1}>{item.notes}</Text>
                  )}
                  <View className="flex-row items-center self-start gap-1 px-2 py-[3px] rounded-lg mt-1" style={{ backgroundColor: item.user === 'Noval' ? '#007AFF15' : '#FF2D5515' }}>
                    <Ionicons name={item.user === 'Noval' ? 'man' : 'woman'} size={12} color={item.user === 'Noval' ? '#007AFF' : '#FF2D55'} />
                    <Text className="text-[11px] font-semibold font-rounded-semibold" style={{ color: item.user === 'Noval' ? '#007AFF' : '#FF2D55' }}>
                      {item.user}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View className="items-center gap-2">
                  <View className="flex-row items-center gap-[3px] px-2 py-[3px] rounded-lg" style={{ backgroundColor: prio.color + '20' }}>
                    <Ionicons name={prio.icon as any} size={10} color={prio.color} />
                    <Text className="text-[11px] font-semibold font-rounded-semibold" style={{ color: prio.color }}>{prio.label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDeleteTarget(item.id)} className="w-9 h-9 rounded-full items-center justify-center">
                    <Ionicons name="trash-outline" size={16} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable className="flex-1 bg-[rgba(0,0,0,0.4)] justify-end" onPress={() => setShowModal(false)}>
            <Pressable className="rounded-t-[28px] p-6 gap-3.5 pb-10" style={{ backgroundColor: theme.surfaceElevated }} onPress={() => {}}>
              <View className="w-9 h-[5px] rounded-full self-center mb-1" style={{ backgroundColor: theme.textTertiary }} />
              <View className="items-center mb-1">
                <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: theme.primaryLight }}>
                  <Ionicons name="sparkles" size={28} color={theme.primary} />
                </View>
                <Text className="text-xl font-bold font-rounded-bold text-center" style={{ color: theme.textPrimary }}>Wishlist Baru</Text>
                <Text className="text-sm font-rounded text-center mt-1" style={{ color: theme.textSecondary }}>Aktivitas atau impian bersama</Text>
              </View>

              <Input label="Aktivitas / Impian" placeholder="Nonton bioskop bareng" leftIcon="star-outline" value={name} onChangeText={setName} />
              <Input label="Estimasi budget (opsional)" placeholder="Kosongkan jika gratis" leftIcon="cash-outline" formatType="number" value={price} onChangeText={setPrice} />
              <Input label="Catatan (opsional)" placeholder="Kapan, di mana, atau detail lainnya" leftIcon="create-outline" value={notes} onChangeText={setNotes} />

              <View className="gap-1.5">
                <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: theme.textSecondary }}>Prioritas</Text>
                <View className="flex-row gap-2">
                  {(['low', 'medium', 'high'] as Priority[]).map(p => {
                    const cfg = priorityConfig[p];
                    const isActive = priority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setPriority(p)}
                        className="flex-1 flex-row items-center justify-center gap-1 py-2.5 rounded-xl border"
                        style={{
                          borderColor: isActive ? cfg.color : theme.border,
                          ...(isActive ? { backgroundColor: cfg.color + '15' } : {}),
                        }}
                      >
                        <Ionicons name={cfg.icon as any} size={12} color={isActive ? cfg.color : theme.textTertiary} />
                        <Text className="text-xs font-semibold font-rounded-semibold" style={{ color: isActive ? cfg.color : theme.textTertiary }}>{cfg.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold font-rounded-semibold" style={{ color: theme.textSecondary }}>Atas nama</Text>
                <View className="flex-row gap-2">
                  {(['Noval', 'Kharin'] as UserName[]).map(u => {
                    const cfg = userConfig[u];
                    const isActive = wishlistUser === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setWishlistUser(u)}
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
                <Button title="Batal" variant="ghost" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                <Button title="Tambah" variant="primary" onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ActionSheet
        visible={!!deleteTarget}
        title="Hapus Wishlist"
        message="Yakin ingin menghapus item ini?"
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
