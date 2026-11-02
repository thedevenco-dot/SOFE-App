import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface MetaChipProps {
  label: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * MetaChip: Icon + text in a bg.tint (peach tint) rounded tile.
 * Used for course metadata: duration, level, lesson count, read time, points.
 */
export function MetaChip({ label, icon, style }: MetaChipProps) {
  return (
    <View style={[styles.chip, style]}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={[typography.caption, styles.label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.peachTint,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    color: palette.navy,
    fontWeight: '600',
    fontSize: 12,
  },
});
