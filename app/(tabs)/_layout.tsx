import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/context/colors';
import { useTheme, useThemeScheme } from '@/context/ThemeContext';

const tabIcons: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  '(tabungan)': { focused: 'wallet', default: 'wallet-outline' },
  wishlist: { focused: 'gift', default: 'gift-outline' },
  diary: { focused: 'book', default: 'book-outline' },
  'period-tracker': { focused: 'fitness', default: 'fitness-outline' },
  settings: { focused: 'settings', default: 'settings-outline' },
};

export default function TabLayout() {
  const theme = useTheme();
  const isDark = useThemeScheme() === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
          elevation: 0,
          shadowColor: theme.cardShadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        headerShown: false,
      }}
    >
      {Object.entries(tabIcons).map(([name, icons]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? icons.focused : icons.default}
                size={focused ? 26 : 24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
