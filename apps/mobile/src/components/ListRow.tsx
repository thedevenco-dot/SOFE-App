import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  showChevron = false,
  onPress,
  style,
  testID,
}: ListRowProps) {
  const { colors, spacing } = useTheme();

  const content = (
    <View style={styles.row}>
      {leading && <View style={[styles.leading, { marginRight: spacing.md }]}>{leading}</View>}

      <View style={styles.textContainer}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {trailing ? (
        <View style={[styles.trailing, { marginLeft: spacing.md }]}>{trailing}</View>
      ) : showChevron ? (
        <View style={[styles.trailing, { marginLeft: spacing.sm }]}>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>
      ) : null}
    </View>
  );

  const containerStyle: ViewStyle = {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.7}
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
    width: '100%',
  },
  leading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  trailing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
