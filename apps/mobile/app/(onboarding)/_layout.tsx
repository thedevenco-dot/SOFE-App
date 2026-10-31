import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';

export default function OnboardingLayout() {
  const { colors, palette } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: palette.orange,
        headerTitleStyle: { color: colors.text, fontSize: 15, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="profile" options={{ title: 'Profile (1/4)' }} />
      <Stack.Screen name="goals" options={{ title: 'Goals (2/4)' }} />
      <Stack.Screen name="personalise" options={{ title: 'Personalise (3/4)' }} />
      <Stack.Screen name="permissions" options={{ title: 'First Plan (4/4)' }} />
    </Stack>
  );
}
