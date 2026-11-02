import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';
import { ProgressBar } from './ProgressBar';

export interface MilestoneCardProps {
  eyebrow?: string;
  badgeLabel?: string;
  goal: string;
  targetDate?: string;
  progressPercent: number;
  style?: ViewStyle;
}

/**
 * MilestoneCard for founder goals and sprint targets (Profile).
 * Dark card with eyebrow, serif quote-style goal, target date, ProgressBar and completion text in orange.
 */
export function MilestoneCard({
  eyebrow = 'FOUNDER MILESTONE',
  badgeLabel = 'Active Sprint',
  goal,
  targetDate = 'Target: Q4 2026',
  progressPercent,
  style,
}: MilestoneCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <EyebrowLabel onDark>{eyebrow}</EyebrowLabel>
        {badgeLabel ? (
          <View style={styles.badgePill}>
            <Text style={[typography.caption, styles.badgeText]}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Serif Quote Goal */}
      <Text style={[typography.title2, styles.goalText]}>“{goal}”</Text>

      {/* Target Date */}
      <Text style={[typography.caption, styles.targetText]}>{targetDate}</Text>

      {/* Progress Bar & Percentage */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progressPercent}
          onDark
          leftLabel="Sprint Progress"
          rightLabel={`${progressPercent}% Completed`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.navy,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badgePill: {
    backgroundColor: palette.slate,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: palette.orange,
    fontWeight: '700',
    fontSize: 11,
  },
  goalText: {
    color: palette.white,
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  targetText: {
    color: palette.mutedOnDark,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
});
