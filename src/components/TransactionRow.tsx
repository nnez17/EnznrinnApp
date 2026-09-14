import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Transaction } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateUtils";
import Ionicons from "@expo/vector-icons/Ionicons";

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

const userColors: Record<string, string> = {
  Noval: '#007AFF',
  Kharin: '#FF2D55',
};

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onPress }) => {
  const theme = useTheme();
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.income : theme.expense;
  const amountPrefix = isIncome ? "+" : "-";
  const userName = transaction.user;
  const userColor = userName ? userColors[userName] : theme.textTertiary;
  const hasUser = !!userName;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-3 px-4 rounded-xl gap-2.5"
      style={{ backgroundColor: theme.surfaceElevated }}
    >
      {hasUser && (
        <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: userColor + '15' }}>
          <Ionicons name={userName === 'Noval' ? 'man' : 'woman'} size={14} color={userColor} />
        </View>
      )}
      <View className="flex-1 min-w-0">
        <Text className="text-[15px] font-medium font-rounded-medium" style={{ color: theme.textPrimary }}>
          {transaction.note || (isIncome ? "Pemasukan" : "Pengeluaran")}
        </Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          {hasUser && (
            <>
              <Text className="text-[11px] font-semibold font-rounded-semibold" style={{ color: userColor }}>
                {userName}
              </Text>
              <Text className="text-[11px]" style={{ color: theme.textTertiary }}>·</Text>
            </>
          )}
          <Text className="text-[11px] font-rounded" style={{ color: theme.textSecondary }}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-[15px] font-semibold font-rounded-semibold" style={{ color: amountColor }}>
          {amountPrefix}{formatCurrency(transaction.amount)}
        </Text>
        <Text className="text-[11px] mt-0.5 font-rounded" style={{ color: theme.textTertiary }}>
          Saldo: {formatCurrency(transaction.balance)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
