import React, { forwardRef, useMemo, useCallback } from "react";
import { TextInput, View, Text, TouchableOpacity, ViewStyle, TextStyle, StyleSheet, TextInputProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/colors";
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
  const styles = useMemo(() => createStyles(theme), [theme]);

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
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
        {leftIcon && <Ionicons name={leftIcon as any} size={20} color={hasError ? theme.error : theme.textTertiary} style={styles.icon} />}
        <TextInput
          ref={ref}
          style={[styles.input, leftIcon ? styles.inputWithLeftIcon : undefined, rightIcon ? styles.inputWithRightIcon : undefined, hasError && styles.inputError, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          onChangeText={handleChangeText}
          value={displayValue}
          keyboardType={formatType === 'number' ? 'number-pad' : props.keyboardType}
          {...props}
        />
        {rightIcon && <TouchableOpacity onPress={onRightIconPress} style={styles.iconWrapper}><Ionicons name={rightIcon as any} size={20} color={theme.textTertiary} style={styles.icon} /></TouchableOpacity>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});
Input.displayName = "Input";

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: theme.textSecondary, fontFamily: "SFProRounded-Semibold", letterSpacing: 0.3 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.border },
  inputWrapperError: { borderColor: theme.error },
  icon: { marginLeft: 14 },
  iconWrapper: { paddingRight: 14 },
  input: { flex: 1, fontSize: 16, color: theme.textPrimary, paddingVertical: 14, paddingHorizontal: 14, fontFamily: "SFProRounded-Regular" },
  inputWithLeftIcon: { paddingLeft: 8 },
  inputWithRightIcon: { paddingRight: 8 },
  inputError: { color: theme.error },
  errorText: { fontSize: 12, color: theme.error, fontFamily: "SFProRounded-Regular" },
});
