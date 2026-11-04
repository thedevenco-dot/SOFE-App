import React from 'react';
import { Stack } from 'expo-router';
import { palette } from '@sofe/shared';

export default function PractiseSubLayout() {
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
        name="daily"
        options={{
          title: "Today's Practice",
          headerBackTitle: 'Practise',
        }}
      />
      <Stack.Screen
        name="quiz/[id]"
        options={{
          title: 'Quick Quiz',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="quiz/[id]/result"
        options={{
          title: 'Quiz Breakdown',
          headerBackTitle: 'Practise',
        }}
      />
      <Stack.Screen
        name="reflection"
        options={{
          title: 'Executive Reflection',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="streak"
        options={{
          title: 'Streak & Consistency',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="points"
        options={{
          title: 'Points & Ledger',
          headerBackTitle: 'Practise',
        }}
      />
      <Stack.Screen
        name="rewards"
        options={{
          title: 'Founder Rewards',
          headerBackTitle: 'Practise',
        }}
      />
      <Stack.Screen
        name="rewards/confirm"
        options={{
          title: 'Confirm Reward',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
