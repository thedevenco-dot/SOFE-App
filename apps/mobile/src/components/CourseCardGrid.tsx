import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { TagChip } from './TagChip';

export interface CourseCardGridProps {
  thumbnailUrl?: string;
  tagLabel?: string;
  metaText?: string;
  title: string;
  instructorName?: string;
  rating?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Two-column compact card for grid views (Core Disciplines / Library).
 */
export function CourseCardGrid({
  thumbnailUrl,
  tagLabel,
  metaText,
  title,
  instructorName,
  rating,
  onPress,
  style,
}: CourseCardGridProps) {
  const content = (
    <View style={[styles.card, style]}>
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.slate }]} />
        )}
        {tagLabel ? (
          <View style={styles.tagWrapper}>
            <TagChip label={tagLabel} variant="orange" />
          </View>
        ) : null}
      </View>

      {/* Details */}
      <View style={styles.content}>
        {metaText ? (
          <Text style={[typography.caption, styles.meta]} numberOfLines={1}>
            {metaText}
          </Text>
        ) : null}

        <Text style={[typography.title3, styles.title]} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.footerRow}>
          {instructorName ? (
            <Text style={[typography.caption, styles.instructor]} numberOfLines={1}>
              {instructorName}
            </Text>
          ) : (
            <View />
          )}

          {rating ? (
            <View style={styles.ratingRow}>
              <Star size={12} color={palette.gold} fill={palette.gold} />
              <Text style={[typography.caption, styles.ratingText]}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 4,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  imageContainer: {
    height: 110,
    width: '100%',
    backgroundColor: palette.slate,
    position: 'relative',
  },
  tagWrapper: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  content: {
    padding: spacing.sm + 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  meta: {
    color: palette.mutedOnLight,
    marginBottom: 2,
    fontSize: 11,
  },
  title: {
    color: palette.navy,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  instructor: {
    color: palette.mutedOnLight,
    fontSize: 11,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  ratingText: {
    color: palette.navy,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 2,
  },
});
