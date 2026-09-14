import React, { forwardRef, useCallback } from "react";
import { TextInput, View, Text, TouchableOpacity, ViewStyle, TextStyle, TextInputProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatNumberInput } from "@/utils/formatCurrency";

interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string; placeholder?: string; error?: string; leftIcon?: string; rightIcon?: string;
  onRightIconPress?: () => void; containerStyle?: ViewStyle; inputStyle?: TextStyle;
  formatType?: 'number' | 'text';
  onChangeText?: (text: string) => void;
  value?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label, placeholder, error, leftIcon, rightIcon, onRightIconPress,
  containerStyle, inputStyle, formatType = 'text', onChangeText, value, ...props
}, ref) => {
  const theme = useTheme();
  const hasError = !!error;

  const handleChangeText = useCallback((text: string) => {
    if (!onChangeText) return;
    if (formatType === 'number') {
      const formatted = formatNumberInput(text);
      onChangeText(formatted);
    } else {
      onChangeText(text);
    }
  }, [formatType, onChangeText]);

  const displayValue = formatType === 'number' ? (value || '') : value;

  return (
    <View className="gap-1.5" style={containerStyle}>
      {label && <Text className="text-[13px] font-semibold font-rounded-semibold tracking-[0.3px]" style={{ color: theme.textSecondary }}>{label}</Text>}
      <View
        className={`flex-row items-center rounded-[14px] border ${hasError ? 'border-[#FF3B30]' : ''}`}
        style={{ backgroundColor: theme.surface, borderColor: hasError ? theme.error : theme.border }}
      >
        {leftIcon && <Ionicons name={leftIcon as any} size={20} color={hasError ? theme.error : theme.textTertiary} style={{ marginLeft: 14 }} />}
        <TextInput
          ref={ref}
          className={`flex-1 text-base font-rounded py-3.5 px-3.5 ${leftIcon ? 'pl-2' : ''} ${rightIcon ? 'pr-2' : ''}`}
          style={{ color: hasError ? theme.error : theme.textPrimary }}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          onChangeText={handleChangeText}
          value={displayValue}
          keyboardType={formatType === 'number' ? 'number-pad' : props.keyboardType}
          {...props}
        />
        {rightIcon && <TouchableOpacity onPress={onRightIconPress} style={{ paddingRight: 14 }}><Ionicons name={rightIcon as any} size={20} color={theme.textTertiary} /></TouchableOpacity>}
      </View>
      {error && <Text className="text-xs font-rounded" style={{ color: theme.error }}>{error}</Text>}
    </View>
  );
});
Input.displayName = "Input";
