import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: "none" | "small" | "medium" | "large";
  elevated?: boolean;
  onPress?: () => void;
}

const paddingValues: Record<string, ViewStyle> = {
  none: { padding: 0 },
  small: { padding: 12 },
  medium: { padding: 16 },
  large: { padding: 24 },
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = "medium",
  elevated = false,
  onPress,
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: theme.surfaceElevated,
    borderRadius: 16,
    ...(elevated && {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    }),
    ...paddingValues[padding],
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};
