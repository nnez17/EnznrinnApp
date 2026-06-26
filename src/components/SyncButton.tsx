import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

interface SyncButtonProps {
  onPress: () => void;
  isSyncing?: boolean;
  lastSynced?: number | null;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  onPress,
  isSyncing,
  lastSynced,
}) => {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isSyncing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isSyncing}
      activeOpacity={0.8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isSyncing ? theme.primaryLight : theme.surface,
        borderWidth: 1,
        borderColor: isSyncing ? theme.primary : theme.border,
        alignItems: "center",
        justifyContent: "center",
        ...(isSyncing
          ? {
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }
          : {}),
      }}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isSyncing ? "refresh" : "sync-outline"}
          size={22}
          color={isSyncing ? theme.primary : theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};
