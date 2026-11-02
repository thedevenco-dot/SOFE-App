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
import { ArrowRight } from 'lucide-react-native';
import {
  palette,
  colorRoles,
  radius as defaultRadius,
  spacing as defaultSpacing,
} from '@sofe/shared';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export type ButtonVariant =
  'primary' | 'secondary' | 'dark' | 'ghost' | 'link' | 'icon' | 'destructive';

export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  showTrailingArrow?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * Universal Action Button matching DESIGN_V2.md Section 5.
 * Variants:
 * - primary: Orange fill, navy bold text, height 50, optional trailing arrow
 * - secondary: Cream/white fill, 1px border, navy text, optional leading icon
 * - dark: Navy fill, white text, pill ("Begin Quiz")
 * - ghost / link: Deep orange text (orangeDeep) with arrow ("Analyze →")
 * - icon: Square 36-40, cream fill, bookmark/share
 * - destructive: Error fill, white text
 * States: pressed, loading, disabled.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  trailingIcon,
  showTrailingArrow = false,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  // Metric calculation
  let height: number = size === 'lg' ? 50 : size === 'md' ? 44 : 36;
  let paddingHorizontal: number =
    size === 'lg' ? defaultSpacing.xl : size === 'md' ? defaultSpacing.lg : defaultSpacing.md;
  let borderRadius: number = pill ? defaultRadius.pill : defaultRadius.button;

  let backgroundColor: string = 'transparent';
  let borderColor: string = 'transparent';
  let borderWidth = 0;
  let textColor: string = colors.text;

  switch (variant) {
    case 'primary':
      backgroundColor = palette.orange;
      textColor = palette.navy; // 7:1 contrast on orange
      break;
    case 'secondary':
      backgroundColor = isDark ? palette.slate : palette.white;
      borderColor = isDark ? palette.slate : palette.line;
      borderWidth = 1;
      textColor = isDark ? palette.white : palette.navy;
      break;
    case 'dark':
      backgroundColor = palette.navy;
      textColor = palette.white;
      borderRadius = defaultRadius.pill;
      break;
    case 'ghost':
    case 'link':
      backgroundColor = 'transparent';
      textColor = colorRoles.accentText; // Deep orange on light
      paddingHorizontal = defaultSpacing.xs;
      break;
    case 'icon':
      backgroundColor = isDark ? palette.slate : palette.cream;
      borderColor = isDark ? palette.slate : palette.line;
      borderWidth = 1;
      textColor = isDark ? palette.white : palette.navy;
      height = size === 'lg' ? 44 : size === 'md' ? 40 : 36;
      borderRadius = defaultRadius.button;
      paddingHorizontal = 0;
      break;
    case 'destructive':
      backgroundColor = colors.error;
      textColor = palette.white;
      break;
  }

  const textStyle =
    variant === 'link' || variant === 'ghost'
      ? typography.bodyStrong
      : size === 'sm'
        ? typography.caption
        : typography.button;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? (
            <View style={children ? { marginRight: defaultSpacing.sm } : undefined}>{icon}</View>
          ) : null}
          {children ? (
            <Text style={[textStyle, { color: textColor, textAlign: 'center' }]}>{children}</Text>
          ) : null}
          {trailingIcon ? (
            <View style={{ marginLeft: defaultSpacing.sm }}>{trailingIcon}</View>
          ) : showTrailingArrow ? (
            <View style={{ marginLeft: defaultSpacing.xs + 2 }}>
              <ArrowRight size={16} color={textColor} />
            </View>
          ) : null}
        </View>
      )}
    </>
  );

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (typeof children === 'string' ? children : undefined)
      }
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          height,
          paddingHorizontal: variant === 'icon' ? 0 : paddingHorizontal,
          width: variant === 'icon' ? height : fullWidth ? '100%' : undefined,
          borderRadius,
          backgroundColor,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
