import { useColorScheme } from 'react-native';
import { useSavings } from '@/context/SavingsContext';
import { Colors, ColorScheme } from '@/context/colors';

export function useAppColorScheme(): ColorScheme {
  const { state } = useSavings();
  const systemScheme = useColorScheme() ?? 'light';
  if (state.themeMode === 'system') return systemScheme;
  return state.themeMode;
}

export function useAppTheme() {
  const scheme = useAppColorScheme();
  return Colors[scheme];
}
