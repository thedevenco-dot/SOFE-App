import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * FilterChip for horizontal categories and filter bars.
 * Selected: Navy fill + white text.
 * Unselected: White fill + subtle border + navy text.
 */
export function FilterChip({ label, selected = false, onPress, style }: FilterChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? palette.navy : palette.white,
          borderColor: selected ? palette.navy : palette.line,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.caption,
          styles.label,
          {
            color: selected ? palette.white : palette.navy,
            fontWeight: selected ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    textAlign: 'center',
  },
});
