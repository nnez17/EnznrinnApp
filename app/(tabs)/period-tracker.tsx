import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useCycle } from '@/context/CycleContext';
import CountdownCard from '@/components/CountdownCard';
import PeriodCalendar from '@/components/PeriodCalendar';
import OnboardingForm from '@/components/OnboardingForm';
import { ActionSheet } from '@/components/ActionSheet';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function PeriodTrackerScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { cycleData, loading, setCycleData, resetCycle } = useCycle();
  const [showReset, setShowReset] = React.useState(false);

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.background }}>
        <View style={{ paddingTop: insets.top + 12 }} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      <View className="flex-row justify-between items-center mb-4" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-[30px] font-bold font-rounded-bold tracking-[-0.5px]" style={{ color: theme.textPrimary }}>Siklus</Text>
        {cycleData && (
          <TouchableOpacity onPress={() => setShowReset(true)} hitSlop={12}>
            <Ionicons name="refresh-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {!cycleData ? (
        <OnboardingForm onSave={setCycleData} />
      ) : (
        <>
          <CountdownCard data={cycleData} />
          <PeriodCalendar data={cycleData} />
        </>
      )}

      <ActionSheet
        visible={showReset}
        title="Reset Siklus"
        message="Hapus data siklus dan mulai dari awal?"
        options={[
          { text: 'Reset', style: 'destructive', onPress: () => { resetCycle(); setShowReset(false); } },
          { text: 'Batal', style: 'cancel', onPress: () => setShowReset(false) },
        ]}
        onClose={() => setShowReset(false)}
      />
    </ScrollView>
  );
}
