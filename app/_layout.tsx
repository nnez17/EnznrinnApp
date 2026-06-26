import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { SavingsProvider } from '@/context/SavingsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/context/colors';

SplashScreen.preventAutoHideAsync();

const fontMap = {
  'SFProRounded-Regular': require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
  'SFProRounded-Medium': require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
  'SFProRounded-Semibold': require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
  'SFProRounded-Bold': require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
};

function AppNavigator() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync(fontMap).then(() => {
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SavingsProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SavingsProvider>
    </ErrorBoundary>
  );
}
