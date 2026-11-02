import { Stack } from 'expo-router';

export default function StartupWorldLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    />
  );
}
