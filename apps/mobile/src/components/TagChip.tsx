import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export type TagChipVariant = 'orange' | 'dark' | 'translucent';

export interface TagChipProps {
  label: string;
  variant?: TagChipVariant;
  style?: ViewStyle;
}

/**
 * Small label chip for image tags, category ribbons, and topics.
 * Variants:
 * - orange: Orange fill with bold navy text (~7:1 contrast)
 * - dark: Solid slate/navy with white text
 * - translucent: Dark translucent navy overlay with white text
 */
export function TagChip({ label, variant = 'orange', style }: TagChipProps) {
  let backgroundColor: string = palette.orange;
  let textColor: string = palette.navy;

  if (variant === 'dark') {
    backgroundColor = palette.slate;
    textColor = palette.white;
  } else if (variant === 'translucent') {
    backgroundColor = 'rgba(6, 30, 48, 0.75)';
    textColor = palette.white;
  }

  return (
    <View style={[styles.chip, { backgroundColor }, style]}>
      <Text style={[typography.eyebrow, styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});
