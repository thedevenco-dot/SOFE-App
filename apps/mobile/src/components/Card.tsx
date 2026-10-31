import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme-context';

export type CardVariant = 'default' | 'raised' | 'outlined';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  variant = 'default',
  padding,
  onPress,
  style,
  testID,
}: CardProps) {
  const { colors, radius, spacing, isDark, palette } = useTheme();

  const pad = padding !== undefined ? padding : spacing.lg;
  const backgroundColor =
    variant === 'raised'
      ? colors.surfaceRaised
      : variant === 'outlined'
        ? 'transparent'
        : colors.surface;

  const borderWidth = variant === 'outlined' || !isDark ? 1 : 0;
  const borderColor = colors.border;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius: radius.lg,
    padding: pad,
    borderWidth,
    borderColor,
    // Soft shadow on light surfaces per DESIGN.md (y: 2, blur: 8, 8% navy)
    ...(!isDark && {
      shadowColor: palette.navy,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.card, cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[styles.card, cardStyle, style]}>
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
