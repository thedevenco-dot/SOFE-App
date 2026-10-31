import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../src/theme/theme-context';
import { typography } from '../src/theme/typography';
import { useLearnerAuth } from '../src/lib/learner-auth-context';
import { getOnboardingResumeRoute } from '../src/lib/onboarding-resume';

export default function SplashScreen() {
  const { colors, palette, spacing } = useTheme();
  const { user, token, isLoading } = useLearnerAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      try {
        if (!token) {
          // No active session -> go to Welcome Carousel (ON2)
          router.replace('/(auth)/welcome');
        } else {
          // Active session -> determine whether onboarding is done or resume at first incomplete step
          const target = getOnboardingResumeRoute(user);
          router.replace(target);
        }
      } catch {
        router.replace('/(auth)/welcome');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isLoading, token, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.display, { color: palette.orange, textAlign: 'center' }]}>SOFE</Text>
      <Text
        style={[
          typography.title3,
          { color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
        ]}
      >
        School of Founder Education
      </Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
        ]}
      >
        Learn • Create • Lead
      </Text>

      <ActivityIndicator size="small" color={palette.orange} style={{ marginTop: spacing.xxl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
