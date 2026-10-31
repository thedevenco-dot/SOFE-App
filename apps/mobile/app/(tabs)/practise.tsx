import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';

export default function PractiseScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.text }]}>Practise</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Build founder intuition with deliberate daily micro-challenges.
        </Text>

        {/* Streak & Points Summary */}
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
          <View style={styles.row}>
            <View>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Current Streak</Text>
              <Text style={[typography.title1, { color: palette.orange, marginTop: spacing.xs }]}>
                0 Days 🔥
              </Text>
            </View>
            <View>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Points</Text>
              <Text style={[typography.title1, { color: palette.gold, marginTop: spacing.xs }]}>
                0 pts
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Practice Slots */}
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
          <Text style={[typography.title3, { color: colors.text }]}>Today&apos;s Workout</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
            1. Quick Quiz: Unit Economics 101
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
            2. Daily Founder Reflection
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
