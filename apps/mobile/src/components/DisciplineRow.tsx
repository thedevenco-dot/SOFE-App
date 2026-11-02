import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { TagChip } from './TagChip';

export interface DisciplineRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  progressPercent?: number;
  isNew?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * DisciplineRow for Practise modules and specialized tracks.
 * Icon tile (bg.tint + orange icon), title, truncated subtitle, trailing percent pill and chevron.
 */
export function DisciplineRow({
  icon,
  title,
  subtitle,
  progressPercent,
  isNew = false,
  onPress,
  style,
}: DisciplineRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.container, style]}
    >
      {/* Leading Icon Tile in bg.tint */}
      <View style={styles.iconTile}>{icon}</View>

      {/* Center Details */}
      <View style={styles.centerCol}>
        <Text style={[typography.title3, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.caption, styles.subtitle]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Trailing: "New" or Percent pill + Chevron */}
      <View style={styles.trailingRow}>
        {isNew ? (
          <TagChip label="NEW" variant="orange" style={{ marginRight: spacing.xs }} />
        ) : progressPercent !== undefined ? (
          <View style={styles.percentBadge}>
            <Text style={[typography.caption, styles.percentText]}>{progressPercent}%</Text>
          </View>
        ) : null}

        <ChevronRight size={18} color={palette.mutedOnLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: palette.navy,
  },
  subtitle: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
  trailingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  percentBadge: {
    backgroundColor: palette.peachTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
  },
  percentText: {
    color: palette.navy,
    fontWeight: '700',
    fontSize: 11,
  },
});
