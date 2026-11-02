import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface TrendingRowProps {
  rank: number;
  title: string;
  repliesCount?: number;
  detail?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Trending topic row (Network screen).
 * "#1" rank, title, "54 replies · detail", trailing chevron.
 */
export function TrendingRow({
  rank,
  title,
  repliesCount = 54,
  detail = 'Product-Market Fit',
  onPress,
  style,
}: TrendingRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.container, style]}
    >
      {/* Rank Indicator */}
      <Text style={[typography.title3, styles.rankText]}>#{rank}</Text>

      {/* Title & Replies */}
      <View style={styles.centerCol}>
        <Text style={[typography.bodyStrong, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.caption, styles.detailText]} numberOfLines={1}>
          {repliesCount} replies · {detail}
        </Text>
      </View>

      {/* Trailing Chevron */}
      <ChevronRight size={18} color={palette.mutedOnLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  rankText: {
    color: palette.orangeDeep,
    width: 32,
    fontWeight: '800',
  },
  centerCol: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  title: {
    color: palette.navy,
  },
  detailText: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
});
