import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { palette, colorRoles } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface EyebrowLabelProps {
  children: string;
  onDark?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Small uppercase label with tracking for category, status, and module indicators.
 * Default color: orange on dark, accent.text (orangeDeep) on light.
 */
export function EyebrowLabel({ children, onDark = false, color, style }: EyebrowLabelProps) {
  const resolvedColor = color || (onDark ? palette.orange : colorRoles.accentText);

  return (
    <Text style={[typography.eyebrow, styles.base, { color: resolvedColor }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0.8,
  },
});
