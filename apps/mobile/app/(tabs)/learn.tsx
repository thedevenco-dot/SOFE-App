import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';

export default function LearnScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.text }]}>Learn</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Structured founder courses and curated masterclasses.
        </Text>

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
          <Text style={[typography.title3, { color: colors.text }]}>Active Courses</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
            No active courses enrolled yet. Browse the catalogue to begin your curriculum.
          </Text>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: palette.navy,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginTop: spacing.md,
                alignSelf: 'flex-start',
              },
            ]}
          >
            <Text style={[typography.caption, { color: palette.orange }]}>BROWSE CATALOGUE</Text>
          </View>
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
  tag: {},
});
