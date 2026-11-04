import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
