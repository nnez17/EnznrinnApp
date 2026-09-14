import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
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
    <View className="items-center gap-4">
      <View className="relative items-center justify-center mb-2" style={{ width: SIZE, height: SIZE }}>
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
        <View
          className="absolute items-center justify-center"
          style={{ width: SIZE - STROKE * 2, height: SIZE - STROKE * 2, borderRadius: (SIZE - STROKE * 2) / 2, backgroundColor: theme.surface }}
        >
          <Text className="text-[36px] font-bold font-rounded-bold" style={{ color: theme.textPrimary }}>{Math.round(pct * 100)}%</Text>
          <Text className="text-[13px] font-medium font-rounded-medium mt-0.5" style={{ color: theme.textSecondary }}>{isCompleted ? "Tercapai!" : "terkumpul"}</Text>
          <Text className="text-xs font-rounded mt-0.5" style={{ color: theme.textTertiary }}>{formatCurrency(currentBalance)}</Text>
        </View>
      </View>

      <View className="flex-row justify-between w-full rounded-2xl py-4 px-2" style={{ backgroundColor: theme.surfaceElevated }}>
        <View className="flex-1 items-center gap-1">
          <Text className="text-[11px] font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Target</Text>
          <Text className="text-[15px] font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>{formatCurrency(target.targetAmount)}</Text>
        </View>
        <View className="w-px h-9" style={{ backgroundColor: theme.border }} />
        <View className="flex-1 items-center gap-1">
          <Text className="text-[11px] font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Terkumpul</Text>
          <Text className="text-[15px] font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>{formatCurrency(currentBalance)}</Text>
        </View>
        <View className="w-px h-9" style={{ backgroundColor: theme.border }} />
        <View className="flex-1 items-center gap-1">
          <Text className="text-[11px] font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Sisa</Text>
          <Text className="text-[15px] font-semibold font-rounded-semibold" style={{ color: isCompleted ? theme.success : theme.primary }}>{formatCurrency(Math.max(target.targetAmount - currentBalance, 0))}</Text>
        </View>
      </View>

      <View className="flex-row justify-between w-full rounded-2xl py-4 px-2 gap-2" style={{ backgroundColor: theme.surfaceElevated }}>
        <View className="flex-1 items-center gap-1">
          <Text className="text-[11px] font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Batas Waktu</Text>
          <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.textPrimary }}>{formatDate(target.deadline)}</Text>
        </View>
        <View className="w-px h-9" style={{ backgroundColor: theme.border }} />
        <View className="flex-1 items-center gap-1">
          <Text className="text-[11px] font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>{isCompleted ? "Selesai" : isOverdue ? "Terlambat" : "Hari Tersisa"}</Text>
          <Text
            className="text-sm font-semibold font-rounded-semibold"
            style={isCompleted ? { color: theme.success } : isOverdue ? { color: theme.error } : undefined}
          >
            {isCompleted ? "✓" : isOverdue ? `${Math.abs(daysLeft)} hari` : `${daysLeft} hari`}
          </Text>
        </View>
        {!isCompleted && daysLeft > 0 && (
          <View className="w-px h-9" style={{ backgroundColor: theme.border }} />
        )}
        {!isCompleted && daysLeft > 0 && (
          <View className="flex-1 items-center gap-1">
            <Text className="text-[11px] font-medium font-rounded-medium" style={{ color: theme.textSecondary }}>Per Hari</Text>
            <Text className="text-sm font-semibold font-rounded-semibold" style={{ color: theme.primary }}>{formatCurrency(dailyNeeded)}</Text>
          </View>
        )}
      </View>

      {!isCompleted && daysLeft > 0 && (
        <View className="w-full p-4 rounded-[14px] flex-row justify-between items-center" style={{ backgroundColor: theme.primaryLight }}>
          <Text className="text-sm font-medium font-rounded-medium" style={{ color: theme.primary }}>Butuh per hari</Text>
          <Text className="text-base font-bold font-rounded-bold" style={{ color: theme.primary }}>{formatCurrency(dailyNeeded)}/hari</Text>
        </View>
      )}
    </View>
  );
};
