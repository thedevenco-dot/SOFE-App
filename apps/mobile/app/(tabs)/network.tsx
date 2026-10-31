import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing, themes } from '@sofe/shared';
import { typography } from '../../src/theme/typography';

export default function NetworkScreen() {
  const lightColors = themes.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: lightColors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: lightColors.text }]}>Founder Network</Text>
        <Text style={[typography.body, { color: lightColors.textMuted, marginTop: spacing.xs }]}>
          Connect, collaborate, and share progress with fellow founders.
        </Text>

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
          <Text style={[typography.title3, { color: lightColors.text }]}>Coming in v1.5</Text>
          <Text style={[typography.body, { color: lightColors.textMuted, marginTop: spacing.sm }]}>
            The peer founder network is currently behind a private beta flag.
          </Text>
          <Text
            style={[
              typography.caption,
              { color: palette.orangeDeep, marginTop: spacing.md, fontWeight: '600' },
            ]}
          >
            STATUS: PRIVATE BETA
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
