import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Bookmark, ChevronRight } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';

export interface CourseCardRowProps {
  thumbnailUrl?: string;
  label?: string;
  title: string;
  metaText?: string;
  progressPercent?: number;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Compact horizontal course/article row matching DESIGN_V2.md.
 * 64-72px thumbnail left, category label, title, meta line, trailing bookmark or progress percent.
 */
export function CourseCardRow({
  thumbnailUrl,
  label,
  title,
  metaText,
  progressPercent,
  isBookmarked,
  onBookmarkToggle,
  onPress,
  style,
}: CourseCardRowProps) {
  const content = (
    <View style={[styles.row, style]}>
      {/* 68px Thumbnail */}
      <View style={styles.thumbnail}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.peachTint }]} />
        )}
      </View>

      {/* Center Details */}
      <View style={styles.centerCol}>
        {label ? <EyebrowLabel style={{ marginBottom: 2 }}>{label}</EyebrowLabel> : null}
        <Text style={[typography.title3, styles.title]} numberOfLines={2}>
          {title}
        </Text>
        {metaText ? (
          <Text style={[typography.caption, styles.meta]} numberOfLines={1}>
            {metaText}
          </Text>
        ) : null}
      </View>

      {/* Trailing Action: Bookmark or Percent */}
      <View style={styles.trailing}>
        {progressPercent !== undefined ? (
          <View style={styles.percentBadge}>
            <Text style={[typography.caption, styles.percentText]}>{progressPercent}%</Text>
          </View>
        ) : onBookmarkToggle ? (
          <TouchableOpacity
            onPress={onBookmarkToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Bookmark item"
          >
            <Bookmark
              size={18}
              color={isBookmarked ? palette.orange : palette.mutedOnLight}
              fill={isBookmarked ? palette.orange : 'transparent'}
            />
          </TouchableOpacity>
        ) : (
          <ChevronRight size={18} color={palette.mutedOnLight} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.slate,
  },
  centerCol: {
    flex: 1,
    marginHorizontal: spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: palette.navy,
  },
  meta: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBadge: {
    backgroundColor: palette.peachTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  percentText: {
    color: palette.navy,
    fontWeight: '700',
    fontSize: 11,
  },
});
