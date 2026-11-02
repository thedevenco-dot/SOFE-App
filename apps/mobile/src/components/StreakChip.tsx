import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Flame } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface StreakChipProps {
  days: number;
  points?: number;
  style?: ViewStyle;
}

/**
 * Streak indicator pill for header and hero zones.
 * Displays flame icon with streak count (e.g. "Day 26 Streak" or "7D Streak +340 pts").
 */
export function StreakChip({ days, points, style }: StreakChipProps) {
  const hasPoints = points !== undefined && points > 0;

  return (
    <View style={[styles.pill, style]}>
      <Flame size={14} color={palette.orange} fill={palette.orange} />
      <Text style={[typography.caption, styles.text]}>
        {hasPoints ? `${days}D Streak ` : `Day ${days} Streak`}
        {hasPoints ? <Text style={styles.pointsText}>+{points} pts</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  pointsText: {
    color: palette.orange,
    fontWeight: '700',
  },
});
