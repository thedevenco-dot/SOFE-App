import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.75);

export interface CarouselCardProps {
  thumbnailUrl?: string;
  category: string;
  duration?: string;
  title: string;
  description?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Carousel Card for horizontal scroll rows (Recommended for You).
 * 75% screen width with peek, image top, eyebrow + duration, serif title, one-line description.
 */
export function CarouselCard({
  thumbnailUrl,
  category,
  duration,
  title,
  description,
  onPress,
  style,
}: CarouselCardProps) {
  const content = (
    <View style={[styles.card, style]}>
      {/* Image */}
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
      </View>

      {/* Info */}
      <View style={styles.content}>
        <View style={styles.eyebrowRow}>
          <EyebrowLabel>{category}</EyebrowLabel>
          {duration ? (
            <Text style={[typography.caption, styles.durationText]}>{duration}</Text>
          ) : null}
        </View>

        <Text style={[typography.title3, styles.title]} numberOfLines={2}>
          {title}
        </Text>

        {description ? (
          <Text style={[typography.body, styles.desc]} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.soft,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    backgroundColor: palette.slate,
  },
  content: {
    padding: spacing.md,
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  durationText: {
    color: palette.mutedOnLight,
    fontSize: 11,
  },
  title: {
    color: palette.navy,
    marginBottom: 4,
  },
  desc: {
    color: palette.mutedOnLight,
  },
});
