import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSavings } from './SavingsContext';
import { Colors, ColorScheme } from './colors';

const ThemeContext = createContext<typeof Colors.light>(Colors.light);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { state } = useSavings();
  const systemScheme = useColorScheme() ?? 'light';
  const resolved: ColorScheme = state.themeMode === 'system' ? systemScheme : state.themeMode;
  const theme = Colors[resolved];
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeScheme(): ColorScheme {
  const { state } = useSavings();
  const systemScheme = useColorScheme() ?? 'light';
  return state.themeMode === 'system' ? systemScheme : state.themeMode;
}
