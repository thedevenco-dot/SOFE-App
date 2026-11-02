import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';

export interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * StatTile for 2x2 founder metric grids (Profile / Dashboard).
 * Eyebrow label top-left, orange icon top-right, large serif numeric + optional orange unit, muted caption.
 */
export function StatTile({ label, value, unit, caption, icon, style }: StatTileProps) {
  return (
    <View style={[styles.tile, style]}>
      {/* Top Row: Eyebrow + Icon */}
      <View style={styles.topRow}>
        <EyebrowLabel>{label}</EyebrowLabel>
        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      </View>

      {/* Numeric Value + Unit */}
      <View style={styles.valueRow}>
        <Text style={[typography.numeric, styles.valueText]}>
          {value}
          {unit ? <Text style={styles.unitText}> {unit}</Text> : null}
        </Text>
      </View>

      {/* Optional Caption */}
      {caption ? (
        <Text style={[typography.caption, styles.captionText]} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    flex: 1,
    minHeight: 104,
    justifyContent: 'space-between',
    ...shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  valueText: {
    color: palette.navy,
  },
  unitText: {
    color: palette.orange,
    fontSize: 16,
    fontWeight: '700',
  },
  captionText: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
});
