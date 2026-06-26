import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Balance } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrency } from "@/utils/formatCurrency";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

interface BalanceCardProps { balance: Balance; style?: ViewStyle; }

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, style }) => {
  const theme = useTheme();

  const animatedValue = useSharedValue(0);
  useEffect(() => {
    animatedValue.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ translateY: withTiming(0, { duration: 600 }) }],
  }));

  return (
    <Animated.View style={[cardStyle]}>
      <View style={[styles.container, { backgroundColor: theme.primary }, style]}>
        <View style={[styles.glow, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        <View style={[styles.glow2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

        <View style={styles.topRow}>
          <View style={styles.labelRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.label}>Total Tabungan</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.badgeText}>IDR</Text>
          </View>
        </View>

        <Text style={styles.amount}>{formatCurrency(balance.current)}</Text>

        <View style={styles.divider} />

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="arrow-down-circle" size={18} color="#4CD964" />
            <Text style={styles.detailLabel}>Pemasukan</Text>
            <Text style={[styles.detailValue, { color: '#4CD964' }]}>{formatCurrency(balance.totalIncome)}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Ionicons name="arrow-up-circle" size={18} color="#FF6B6B" />
            <Text style={styles.detailLabel}>Pengeluaran</Text>
            <Text style={[styles.detailValue, { color: '#FF6B6B' }]}>{formatCurrency(balance.totalExpense)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    padding: 24,
    paddingTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  glow2: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    fontFamily: "SFProRounded-Semibold",
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "SFProRounded-Bold",
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "SFProRounded-Bold",
    letterSpacing: -1,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 16,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  detailDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 16,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    fontFamily: "SFProRounded-Medium",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "SFProRounded-Bold",
  },
});
