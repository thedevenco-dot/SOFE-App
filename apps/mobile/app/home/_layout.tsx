import React from 'react';
import { Stack } from 'expo-router';
import { palette } from '@sofe/shared';

export default function HomeSubLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.navy,
        },
        headerTintColor: palette.cream,
        headerTitleStyle: {
          fontFamily: 'Newsreader_600SemiBold',
        },
        contentStyle: {
          backgroundColor: palette.cream,
        },
      }}
    >
      <Stack.Screen
        name="vision"
        options={{
          title: 'Vision Board',
          headerBackTitle: 'Home',
        }}
      />
      <Stack.Screen
        name="vision-edit"
        options={{
          title: 'Edit Vision Item',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="quote"
        options={{
          title: 'Founder Manifesto',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="word"
        options={{
          title: 'Daily Focus Word',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="plan"
        options={{
          title: "Today's Protocol",
          headerBackTitle: 'Home',
        }}
      />
    </Stack>
  );
}
