import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';

export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="edit"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="achievement/[id]"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="projects/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="projects/edit"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="projects/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
