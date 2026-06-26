import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  TouchableOpacity,
} from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { Colors } from '@/context/colors';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';
import Ionicons from '@expo/vector-icons/Ionicons';
import { hasFirebaseConfig } from '@/config/env';


function SettingRow({
  icon, label, value, onPress, theme, destructive, isLast, rightIcon,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  theme: typeof Colors.light;
  destructive?: boolean;
  isLast?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: theme.surfaceElevated },
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: theme.separator },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: destructive ? '#FF3B3015' : theme.primaryLight }]}>
        <Ionicons name={icon} size={18} color={destructive ? '#FF3B30' : theme.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: destructive ? '#FF3B30' : theme.textPrimary }]}>
        {label}
      </Text>
      {value && <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{value}</Text>}
      {(onPress || rightIcon) && !destructive &&
        <Ionicons name={rightIcon || 'chevron-forward'} size={16} color={theme.textTertiary} />
      }
    </TouchableOpacity>
  );
}

const themeOptions: { key: 'system' | 'light' | 'dark'; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'system', icon: 'phone-portrait-outline', label: 'Sistem' },
  { key: 'light', icon: 'sunny-outline', label: 'Terang' },
  { key: 'dark', icon: 'moon-outline', label: 'Gelap' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { state, syncFromSheet, setThemeMode } = useSavings();
  const isConnected = hasFirebaseConfig;
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try { await syncFromSheet(); }
    catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Gagal sinkronisasi'); }
    finally { setSyncing(false); }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Pengaturan</Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Sinkronisasi</Text>
      <View style={styles.section}>
        <SettingRow
          icon="cloud-done-outline"
          label="Terakhir Sinkron"
          value={state.lastSynced ? new Date(state.lastSynced).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tidak pernah'}
          theme={theme}
          isLast={false}
        />
        <SettingRow
          icon="checkmark-circle-outline"
          label="Status"
          value={isConnected ? 'Tersambung' : 'Belum dikonfigurasi'}
          theme={theme}
          isLast={true}
        />
      </View>

      {!isConnected && (
        <Button
          title="Sinkronkan Sekarang"
          variant="primary"
          onPress={handleSync}
          loading={syncing}
          leftIcon={<Ionicons name="sync-outline" size={20} color="#FFF" />}
          fullWidth
        />
      )}

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Tampilan</Text>
      <View style={styles.section}>
        <View style={[styles.settingRow, { backgroundColor: theme.surfaceElevated }]}>
          <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Mode</Text>
          <View style={styles.themeToggle}>
            {themeOptions.map((opt) => {
              const isActive = state.themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setThemeMode(opt.key)}
                  style={[
                    styles.themeOption,
                    { borderColor: theme.border },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={14}
                    color={isActive ? '#FFF' : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isActive ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          Dibuat oleh Noval dengan ❤️ untuk pacarku Kharin
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  header: {
    paddingTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'SFProRounded-Bold',
    letterSpacing: -0.5,
  },
  section: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semibold',
    marginLeft: 4,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SFProRounded-Medium',
  },
  settingValue: {
    fontSize: 13,
    fontFamily: 'SFProRounded-Regular',
    maxWidth: 120,
    textAlign: 'right',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'SFProRounded-Regular',
  },
  themeToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SFProRounded-Semifold',
  },
  footer: {
    marginTop: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'SFProRounded-Regular',
    lineHeight: 22,
  },
});
