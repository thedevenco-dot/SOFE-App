import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, spacing, radius, themes } from '@sofe/shared';
import { typography } from '../../src/theme/typography';

export default function StartupWorldScreen() {
  const lightColors = themes.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: lightColors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: lightColors.text }]}>Startup World</Text>
        <Text style={[typography.body, { color: lightColors.textMuted, marginTop: spacing.xs }]}>
          Deep dives, teardowns, and curated insights for startup founders.
        </Text>

        {/* Featured Article Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: lightColors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.xl,
              borderColor: lightColors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: palette.orangeDeep, textTransform: 'uppercase', fontWeight: '600' },
            ]}
          >
            IDEA & VALIDATION
          </Text>
          <Text style={[typography.title2, { color: lightColors.text, marginTop: spacing.xs }]}>
            How to Validate Your B2B Idea Without Writing a Single Line of Code
          </Text>
          <Text style={[typography.body, { color: lightColors.textMuted, marginTop: spacing.sm }]}>
            A 4-step framework used by top founders to pre-sell software before building the MVP.
          </Text>
          <Text
            style={[typography.caption, { color: lightColors.textMuted, marginTop: spacing.md }]}
          >
            5 min read • By SOFE Editorial
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
