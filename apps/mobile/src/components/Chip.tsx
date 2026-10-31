import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export type ChipVariant = 'topic' | 'filter' | 'points';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Chip({
  label,
  variant = 'topic',
  selected = false,
  icon,
  onPress,
  style,
  testID,
}: ChipProps) {
  const { colors, palette, radius, spacing, isDark } = useTheme();

  let backgroundColor: string = colors.surface;
  let textColor: string = colors.text;
  let borderColor: string = colors.border;
  let borderWidth = isDark ? 0 : 1;

  if (variant === 'points') {
    backgroundColor = isDark ? colors.surface : palette.cream;
    textColor = palette.gold;
    borderColor = palette.gold;
    borderWidth = 1;
  } else if (variant === 'topic') {
    backgroundColor = isDark ? palette.slate : palette.cream;
    textColor = isDark ? palette.orange : palette.orangeDeep;
    borderColor = isDark ? palette.slate : palette.line;
    borderWidth = 1;
  } else if (variant === 'filter') {
    if (selected) {
      backgroundColor = palette.orange;
      textColor = palette.navy; // Bold navy on orange = ~7:1 contrast
      borderColor = palette.orange;
      borderWidth = 1;
    } else {
      backgroundColor = colors.surface;
      textColor = colors.textMuted;
      borderColor = colors.border;
      borderWidth = 1;
    }
  }

  const content = (
    <View style={styles.row}>
      {variant === 'points' && !icon ? (
        <Flame size={14} color={palette.gold} fill={palette.gold} style={{ marginRight: 4 }} />
      ) : icon ? (
        <View style={{ marginRight: 4 }}>{icon}</View>
      ) : null}
      <Text
        style={[
          typography.micro,
          {
            color: textColor,
            fontWeight: '600',
            textTransform: variant === 'topic' ? 'uppercase' : 'none',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  const containerStyle: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor,
    borderColor,
    borderWidth,
    alignSelf: 'flex-start',
  };

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.8}
        onPress={onPress}
        style={[containerStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[containerStyle, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
