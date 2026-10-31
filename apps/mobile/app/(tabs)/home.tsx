import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';

export default function HomeScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Greeting */}
        <Text style={[typography.display, { color: colors.text }]}>Welcome back,</Text>
        <Text style={[typography.title1, { color: palette.orange, marginTop: spacing.xs }]}>
          Founder
        </Text>

        {/* Daily Manifestation Word & Quote Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.xl,
            },
          ]}
        >
          <Text style={[typography.caption, { color: palette.gold, textTransform: 'uppercase' }]}>
            Daily Focus
          </Text>
          <Text style={[typography.title2, { color: colors.text, marginTop: spacing.xs }]}>
            Relentless Execution
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
            “Ideas are easy. Implementation is hard.” — Guy Kawasaki
          </Text>
        </View>

        {/* Today's Plan Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.title3, { color: colors.text }]}>Today&apos;s Plan</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Complete your quick quiz and continue your active course.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  card: {
    width: '100%',
  },
});
