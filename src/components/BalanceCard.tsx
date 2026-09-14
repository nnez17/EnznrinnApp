import React, { useEffect } from "react";
import { View, Text, ViewStyle } from "react-native";
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
      <View
        className="rounded-[28px] p-6 pt-5 overflow-hidden"
        style={{ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 12, ...style }}
      >
        <View className="absolute -top-16 -right-10 w-[180px] h-[180px] rounded-[90px] bg-[rgba(255,255,255,0.08)]" />
        <View className="absolute -bottom-20 -left-[50px] w-[250px] h-[250px] rounded-[125px] bg-[rgba(255,255,255,0.05)]" />

        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full items-center justify-center bg-[rgba(255,255,255,0.2)]">
              <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.9)" />
            </View>
            <Text className="text-sm font-semibold font-rounded-semibold tracking-[0.3px] text-[rgba(255,255,255,0.8)]">Total Tabungan</Text>
          </View>
          <View className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.2)]">
            <Text className="text-[11px] font-bold font-rounded-bold tracking-[0.5px] text-[rgba(255,255,255,0.9)]">IDR</Text>
          </View>
        </View>

        <Text className="text-[44px] font-bold font-rounded-bold tracking-[-1px] text-white mb-1">
          {formatCurrency(balance.current)}
        </Text>

        <View className="h-px my-4 bg-[rgba(255,255,255,0.15)]" />

        <View className="flex-row justify-between items-center">
          <View className="flex-1 flex-col items-start gap-0.5">
            <Ionicons name="arrow-down-circle" size={18} color={theme.income} />
            <Text className="text-[11px] font-medium font-rounded-medium text-[rgba(255,255,255,0.6)]">Pemasukan Hari Ini</Text>
            <Text className="text-[15px] font-bold font-rounded-bold" style={{ color: theme.income }}>{formatCurrency(balance.todayIncome)}</Text>
          </View>
          <View className="w-px h-9 mx-4 bg-[rgba(255,255,255,0.15)]" />
          <View className="flex-1 flex-col items-start gap-0.5">
            <Ionicons name="arrow-up-circle" size={18} color={theme.expense} />
            <Text className="text-[11px] font-medium font-rounded-medium text-[rgba(255,255,255,0.6)]">Pengeluaran Hari Ini</Text>
            <Text className="text-[15px] font-bold font-rounded-bold" style={{ color: theme.expense }}>{formatCurrency(balance.todayExpense)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
