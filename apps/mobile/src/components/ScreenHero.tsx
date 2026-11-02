import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';
import { StreakChip } from './StreakChip';

export interface ScreenHeroProps {
  eyebrow?: string;
  streakDays?: number;
  streakPoints?: number;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

/**
 * Navy zone below the header with eyebrow row (eyebrow left, streak chip right),
 * large serif display title and a muted one-line subtitle.
 */
export function ScreenHero({
  eyebrow,
  streakDays,
  streakPoints,
  title,
  subtitle,
  style,
}: ScreenHeroProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Top Eyebrow / Streak Row */}
      {eyebrow || streakDays ? (
        <View style={styles.topRow}>
          {eyebrow ? <EyebrowLabel onDark>{eyebrow}</EyebrowLabel> : <View />}
          {streakDays ? <StreakChip days={streakDays} points={streakPoints} /> : null}
        </View>
      ) : null}

      {/* Main Title */}
      <Text style={[typography.display, styles.title]}>{title}</Text>

      {/* Subtitle */}
      {subtitle ? <Text style={[typography.body, styles.subtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: palette.white,
    marginTop: 2,
  },
  subtitle: {
    color: palette.mutedOnDark,
    marginTop: 6,
  },
});
