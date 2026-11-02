import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { palette, radius as defaultRadius, shadows, spacing } from '@sofe/shared';
import { useTheme } from '../theme/theme-context';

export type CardVariant =
  'white' | 'dark' | 'tint' | 'outlined-orange' | 'default' | 'raised' | 'outlined';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * Universal Card component matching DESIGN_V2.md Section 5.
 * Variants:
 * - white: Pure white background, 1px border.subtle, soft shadow on cream
 * - dark: Navy background, slate border, no shadow
 * - tint: Peach tint background (#FFF0E0)
 * - outlined-orange: 1px orange outline on cream
 * - default/raised/outlined: Backward-compatible aliases
 */
export function Card({
  children,
  variant = 'white',
  padding,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const { colors, isDark } = useTheme();

  const pad = padding !== undefined ? padding : spacing.lg;

  let backgroundColor: string = palette.white;
  let borderColor: string = palette.line;
  let borderWidth = 1;
  let cardShadow: ViewStyle = shadows.soft;

  switch (variant) {
    case 'dark':
      backgroundColor = palette.navy;
      borderColor = palette.slate;
      borderWidth = 0;
      cardShadow = shadows.none;
      break;
    case 'tint':
      backgroundColor = palette.peachTint;
      borderColor = palette.line;
      borderWidth = 1;
      cardShadow = shadows.none;
      break;
    case 'outlined-orange':
      backgroundColor = palette.cream;
      borderColor = palette.orange;
      borderWidth = 1;
      cardShadow = shadows.none;
      break;
    case 'raised':
      backgroundColor = isDark ? colors.surfaceRaised : palette.white;
      borderColor = isDark ? palette.slate : palette.line;
      borderWidth = 1;
      cardShadow = shadows.soft;
      break;
    case 'outlined':
      backgroundColor = 'transparent';
      borderColor = isDark ? palette.slate : palette.line;
      borderWidth = 1;
      cardShadow = shadows.none;
      break;
    case 'white':
    case 'default':
    default:
      backgroundColor = isDark ? palette.navy : palette.white;
      borderColor = isDark ? palette.slate : palette.line;
      borderWidth = isDark ? 0 : 1;
      cardShadow = isDark ? shadows.none : shadows.soft;
      break;
  }

  const containerStyle: ViewStyle = {
    backgroundColor,
    borderRadius: defaultRadius.card,
    padding: pad,
    borderWidth,
    borderColor,
    ...cardShadow,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[styles.card, containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
});
