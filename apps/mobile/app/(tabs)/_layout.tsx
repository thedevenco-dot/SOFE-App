import React from 'react';
import { Tabs } from 'expo-router';
import { palette } from '@sofe/shared';
import { TabBarIcon } from '../../src/components/TabBarIcon';
import { typography } from '../../src/theme/typography';
import { features } from '../../src/config/features';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.slate,
          borderTopColor: palette.slate,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: palette.orange,
        tabBarInactiveTintColor: palette.mutedOnDark,
        tabBarLabelStyle: {
          ...typography.micro,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="learn" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="practise"
        options={{
          title: 'Practise',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="practise" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="startup-world"
        options={{
          title: 'Startup World',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="startup-world" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          href: features.networkEnabled ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="network" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
