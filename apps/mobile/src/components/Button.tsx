import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  loading = false,
  disabled = false,
  icon,
  onPress,
  style,
  testID,
}: ButtonProps) {
  const { colors, palette, radius, spacing } = useTheme();

  // Size metrics
  const height = size === 'lg' ? 52 : size === 'md' ? 44 : 36;
  const paddingHorizontal = size === 'lg' ? spacing.xl : size === 'md' ? spacing.lg : spacing.md;
  const borderRadius = pill ? radius.pill : radius.md;

  // Background and border styles per variant
  let backgroundColor: string = 'transparent';
  let borderColor: string = 'transparent';
  let borderWidth = 0;
  let textColor: string = colors.text;

  switch (variant) {
    case 'primary':
      backgroundColor = palette.orange;
      textColor = palette.navy; // Bold navy text on orange = ~7:1 contrast (Passes AA & AAA)
      break;
    case 'secondary':
      backgroundColor = 'transparent';
      borderColor = colors.border;
      borderWidth = 1;
      textColor = colors.text;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      textColor = colors.accentText;
      break;
    case 'destructive':
      backgroundColor = colors.error;
      textColor = palette.white;
      break;
  }

  const textStyle = size === 'sm' ? typography.caption : typography.bodyStrong;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          height,
          paddingHorizontal,
          borderRadius,
          backgroundColor,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
          <Text style={[textStyle, { color: textColor, fontWeight: '700' }]}>{children}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
