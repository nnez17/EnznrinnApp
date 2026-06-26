import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Transaction } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/colors";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatTime } from "@/utils/dateUtils";
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
  const iconName = isIncome ? "arrow-down-circle-outline" : "arrow-up-circle-outline";
  const amountPrefix = isIncome ? "+" : "-";
  const userName = transaction.user;
  const userColor = userName ? userColors[userName] : theme.textTertiary;
  const hasUser = !!userName;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: theme.surfaceElevated }]}
    >
      {hasUser && (
        <View style={[styles.userBadge, { backgroundColor: userColor + '15' }]}>
          <Ionicons name={userName === 'Noval' ? 'man' : 'woman'} size={14} color={userColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.note, { color: theme.textPrimary }]}>
          {transaction.note || (isIncome ? "Pemasukan" : "Pengeluaran")}
        </Text>
        <View style={styles.meta}>
          {hasUser && (
            <>
              <Text style={[styles.userName, { color: userColor }]}>
                {userName}
              </Text>
              <Text style={[styles.dot, { color: theme.textTertiary }]}>·</Text>
            </>
          )}
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={[styles.balance, { color: theme.textTertiary }]}>
          Saldo: {formatCurrency(transaction.balance)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  userBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  note: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "SFProRounded-Medium",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  userName: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "SFProRounded-Semibold",
  },
  dot: {
    fontSize: 11,
  },
  date: {
    fontSize: 11,
    fontFamily: "SFProRounded-Regular",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "SFProRounded-Semibold",
  },
  balance: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: "SFProRounded-Regular",
  },
});
