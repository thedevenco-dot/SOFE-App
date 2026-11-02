import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Bookmark, Star } from 'lucide-react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { TagChip } from './TagChip';
import { TimeChip } from './TimeChip';
import { MetaChip } from './MetaChip';
import { AvatarStack } from './Avatar';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

export interface CourseCardLargeProps {
  imageUri?: string;
  imageSource?: ImageSourcePropType;
  tagLabel?: string;
  timeLabel?: string;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  eyebrow: string;
  title: string;
  description?: string;
  metaChips?: string[];
  instructors?: Array<{ name?: string; url?: string }>;
  instructorName?: string;
  rating?: number;
  ratingCount?: number;
  progressPercent?: number;
  progressLabel?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

/**
 * Flagship and Active Curriculum Large Course Card.
 * Matches DESIGN_V2.md Section 5.
 */
export function CourseCardLarge({
  imageUri,
  imageSource,
  tagLabel,
  timeLabel,
  isBookmarked,
  onBookmarkToggle,
  eyebrow,
  title,
  description,
  metaChips,
  instructors,
  instructorName,
  rating,
  ratingCount,
  progressPercent,
  progressLabel,
  ctaLabel = 'Continue learning →',
  onCtaPress,
  style,
}: CourseCardLargeProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Header Image Area */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : imageSource ? (
          <Image source={imageSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.slate }]} />
        )}

        {/* Top Floating Chips / Bookmark */}
        <View style={styles.topFloatRow}>
          <View style={styles.leftChips}>
            {tagLabel ? <TagChip label={tagLabel} variant="orange" /> : null}
            {timeLabel ? <TimeChip label={timeLabel} style={{ marginLeft: spacing.xs }} /> : null}
          </View>
          {onBookmarkToggle ? (
            <TouchableOpacity
              onPress={onBookmarkToggle}
              style={styles.bookmarkBtn}
              accessibilityLabel="Bookmark course"
            >
              <Bookmark
                size={16}
                color={isBookmarked ? palette.orange : palette.white}
                fill={isBookmarked ? palette.orange : 'transparent'}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        {/* Eyebrow */}
        <Text style={[typography.eyebrow, styles.eyebrow]}>{eyebrow}</Text>

        {/* Serif Title */}
        <Text style={[typography.title2, styles.title]}>{title}</Text>

        {/* Description */}
        {description ? (
          <Text style={[typography.body, styles.desc]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        {/* MetaChip Row */}
        {metaChips && metaChips.length > 0 ? (
          <View style={styles.metaRow}>
            {metaChips.map((chip, idx) => (
              <MetaChip key={idx} label={chip} />
            ))}
          </View>
        ) : null}

        {/* Instructor & Rating Row */}
        {instructors || instructorName || rating ? (
          <View style={styles.instructorRow}>
            <View style={styles.instructorLeft}>
              {instructors ? (
                <AvatarStack avatars={instructors} size={24} style={{ marginRight: spacing.xs }} />
              ) : null}
              {instructorName ? (
                <Text style={[typography.caption, styles.instructorText]}>{instructorName}</Text>
              ) : null}
            </View>

            {rating ? (
              <View style={styles.ratingGroup}>
                <Star size={14} color={palette.gold} fill={palette.gold} />
                <Text style={[typography.caption, styles.ratingText]}>
                  {rating.toFixed(1)}
                  {ratingCount ? ` (${ratingCount})` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Progress Bar (if in progress) */}
        {progressPercent !== undefined ? (
          <View style={styles.progressSection}>
            <ProgressBar
              progress={progressPercent}
              leftLabel={progressLabel || 'Curriculum Progress'}
              rightLabel={`${progressPercent}%`}
            />
          </View>
        ) : null}

        {/* Action Button */}
        <Button variant="primary" size="lg" fullWidth onPress={onCtaPress} style={styles.ctaButton}>
          {ctaLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: palette.slate,
  },
  topFloatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  leftChips: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(6, 30, 48, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.lg,
  },
  eyebrow: {
    color: palette.orangeDeep,
    marginBottom: 4,
  },
  title: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  desc: {
    color: palette.mutedOnLight,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  instructorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorText: {
    color: palette.navy,
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: palette.navy,
    fontWeight: '700',
    marginLeft: 4,
  },
  progressSection: {
    marginVertical: spacing.sm,
  },
  ctaButton: {
    marginTop: spacing.sm,
  },
});
