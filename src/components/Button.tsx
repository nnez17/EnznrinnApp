import React, { useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizePresets: Record<string, { container: string; text: TextStyle }> = {
  small: { container: "py-2 px-4", text: { fontSize: 14 } },
  medium: { container: "py-3.5 px-6", text: { fontSize: 16 } },
  large: { container: "py-[18px] px-8", text: { fontSize: 18 } },
};

export const Button = React.forwardRef<React.ComponentRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      title,
      variant = "primary",
      size = "medium",
      fullWidth = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      style,
      onPress,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme();

    const colors = useMemo(() => {
      const bg: Record<string, string> = {
        primary: theme.primary,
        secondary: theme.secondary,
        outline: "transparent",
        ghost: "transparent",
        danger: theme.error,
      };
      const text: Record<string, string> = {
        primary: theme.background,
        secondary: theme.background,
        outline: theme.primary,
        ghost: theme.primary,
        danger: theme.background,
      };
      const border: Record<string, string | undefined> = {
        outline: theme.primary,
      };
      return { bg, text, border };
    }, [theme]);

    const isDisabled = disabled || loading;

    // Colors are theme-dynamic → stay as style objects (PRD §6.2).
    const containerStyle = [
      {
        backgroundColor: colors.bg[variant],
        borderWidth: colors.border[variant] ? 1.5 as const : 0,
        borderColor: colors.border[variant],
        ...((variant === 'primary' || variant === 'danger') ? { shadowColor: colors.bg[variant], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 } : {}),
      },
      isDisabled ? { opacity: 0.5 } : undefined,
      style,
    ].filter(Boolean) as ViewStyle[];

    const textStyle: TextStyle = {
      color: colors.text[variant],
      ...sizePresets[size].text,
    } as TextStyle;

    return (
      <TouchableOpacity
        ref={ref}
        className={`rounded-[14px] flex-row items-center justify-center gap-2 ${sizePresets[size].container} ${fullWidth ? "w-full" : ""} font-rounded-semibold font-semibold`}
        style={containerStyle}
        onPress={isDisabled ? undefined : onPress}
        activeOpacity={0.9}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text[variant]} />
        ) : (
          <>
            {leftIcon}
            <Text style={textStyle}>{title}</Text>
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    );
  },
);

Button.displayName = "Button";
