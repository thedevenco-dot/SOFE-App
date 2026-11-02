import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Clock } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface TimeChipProps {
  label: string;
  style?: ViewStyle;
}

/**
 * Translucent dark pill overlay on images with clock icon (e.g. "18 mins left").
 */
export function TimeChip({ label, style }: TimeChipProps) {
  return (
    <View style={[styles.pill, style]}>
      <Clock size={12} color={palette.white} />
      <Text style={[typography.caption, styles.text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 30, 48, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: {
    color: palette.white,
    fontWeight: '500',
    fontSize: 11,
    marginLeft: 4,
  },
});
