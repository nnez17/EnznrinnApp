import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: "none" | "small" | "medium" | "large";
  elevated?: boolean;
  onPress?: () => void;
}

const paddingClasses: Record<string, string> = {
  none: "",
  small: "p-3",
  medium: "p-4",
  large: "p-6",
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = "medium",
  elevated = false,
  onPress,
}) => {
  const theme = useTheme();

  // Dynamic theme colors + shadow objects stay as style objects (PRD §6.2).
  const themedStyle: ViewStyle = {
    backgroundColor: theme.surfaceElevated,
    ...(elevated && {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        className={`rounded-2xl ${paddingClasses[padding]}`}
        style={themedStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View className={`rounded-2xl ${paddingClasses[padding]}`} style={themedStyle}>{children}</View>;
};
