import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Target } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, getDaysUntil } from "@/utils/dateUtils";
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get("window");
const SIZE = Math.min(width - 64, 240);
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TargetProgressProps {
  target: Target;
  currentBalance: number;
}

export const TargetProgress: React.FC<TargetProgressProps> = ({ target, currentBalance }) => {
  const theme = useTheme();

  const pct = Math.min(currentBalance / target.targetAmount, 1);
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(pct, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - anim.value),
  }));

  const daysLeft = getDaysUntil(target.deadline);
  const dailyNeeded = daysLeft > 0 ? Math.ceil((target.targetAmount - currentBalance) / daysLeft) : 0;
  const isCompleted = currentBalance >= target.targetAmount;
  const isOverdue = daysLeft < 0 && !isCompleted;
  const ringColor = isCompleted ? theme.success : isOverdue ? theme.error : theme.primary;

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={theme.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            animatedProps={animatedProps}
          />
        </Svg>
        <View style={[styles.inner, { width: SIZE - STROKE * 2, height: SIZE - STROKE * 2, borderRadius: (SIZE - STROKE * 2) / 2, backgroundColor: theme.surface }]}>
          <Text style={[styles.pct, { color: theme.textPrimary }]}>{Math.round(pct * 100)}%</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{isCompleted ? "Tercapai!" : "terkumpul"}</Text>
          <Text style={[styles.amount, { color: theme.textTertiary }]}>{formatCurrency(currentBalance)}</Text>
        </View>
      </View>

      <View style={[styles.infoGrid, { backgroundColor: theme.surfaceElevated }]}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Target</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{formatCurrency(target.targetAmount)}</Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Terkumpul</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{formatCurrency(currentBalance)}</Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Sisa</Text>
          <Text style={[styles.infoValue, { color: isCompleted ? theme.success : theme.primary }]}>{formatCurrency(Math.max(target.targetAmount - currentBalance, 0))}</Text>
        </View>
      </View>

      <View style={[styles.deadlineInfo, { backgroundColor: theme.surfaceElevated }]}>
        <View style={styles.deadlineItem}>
          <Text style={[styles.deadlineLabel, { color: theme.textSecondary }]}>Batas Waktu</Text>
          <Text style={[styles.deadlineValue, { color: theme.textPrimary }]}>{formatDate(target.deadline)}</Text>
        </View>
        <View style={[styles.deadlineDivider, { backgroundColor: theme.border }]} />
        <View style={styles.deadlineItem}>
          <Text style={[styles.deadlineLabel, { color: theme.textSecondary }]}>{isCompleted ? "Selesai" : isOverdue ? "Terlambat" : "Hari Tersisa"}</Text>
          <Text style={[styles.deadlineValue, isCompleted && { color: theme.success }, isOverdue && { color: theme.error }]}>
            {isCompleted ? "✓" : isOverdue ? `${Math.abs(daysLeft)} hari` : `${daysLeft} hari`}
          </Text>
        </View>
        {!isCompleted && daysLeft > 0 && (
          <View style={[styles.deadlineDivider, { backgroundColor: theme.border }]} />
        )}
        {!isCompleted && daysLeft > 0 && (
          <View style={styles.deadlineItem}>
            <Text style={[styles.deadlineLabel, { color: theme.textSecondary }]}>Per Hari</Text>
            <Text style={[styles.deadlineValue, { color: theme.primary }]}>{formatCurrency(dailyNeeded)}</Text>
          </View>
        )}
      </View>

      {!isCompleted && daysLeft > 0 && (
        <View style={[styles.dailyNeeded, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.dailyLabel, { color: theme.primary }]}>Butuh per hari</Text>
          <Text style={[styles.dailyValue, { color: theme.primary }]}>{formatCurrency(dailyNeeded)}/hari</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 16 },
  wrapper: { position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 8, width: SIZE, height: SIZE },
  inner: { position: "absolute", alignItems: "center", justifyContent: "center" },
  pct: { fontSize: 36, fontWeight: "700", fontFamily: "SFProRounded-Bold" },
  label: { fontSize: 13, fontFamily: "SFProRounded-Medium", marginTop: 2 },
  amount: { fontSize: 12, fontFamily: "SFProRounded-Regular", marginTop: 2 },
  infoGrid: { flexDirection: "row", justifyContent: "space-between", width: "100%", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8 },
  infoItem: { flex: 1, alignItems: "center", gap: 4 },
  infoDivider: { width: 1, height: 36 },
  infoLabel: { fontSize: 11, fontFamily: "SFProRounded-Medium" },
  infoValue: { fontSize: 15, fontWeight: "600", fontFamily: "SFProRounded-Semibold" },
  deadlineInfo: { flexDirection: "row", justifyContent: "space-between", width: "100%", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, gap: 8 },
  deadlineItem: { flex: 1, alignItems: "center", gap: 4 },
  deadlineLabel: { fontSize: 11, fontFamily: "SFProRounded-Medium" },
  deadlineValue: { fontSize: 14, fontWeight: "600", fontFamily: "SFProRounded-Semibold" },
  deadlineDivider: { width: 1, height: 36 },
  dailyNeeded: { width: "100%", padding: 16, borderRadius: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dailyLabel: { fontSize: 14, fontWeight: "500", fontFamily: "SFProRounded-Medium" },
  dailyValue: { fontSize: 16, fontWeight: "700", fontFamily: "SFProRounded-Bold" },
});
