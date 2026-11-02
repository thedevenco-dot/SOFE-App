import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { TagChip } from './TagChip';
import { MetaChip } from './MetaChip';
import { Button } from './Button';

export interface FeaturedChallengeCardProps {
  imageUri?: string;
  tagLabel?: string;
  categoryLabel?: string;
  title: string;
  description: string;
  metaChips: string[];
  onStartPress?: () => void;
  style?: ViewStyle;
}

/**
 * Featured Daily Challenge Card (Case Simulation) for Practise screen.
 * Image top with tags, serif question title, description, 2x2 MetaChip grid, primary CTA.
 */
export function FeaturedChallengeCard({
  imageUri,
  tagLabel = 'CASE SIMULATION #42',
  categoryLabel = 'Seed Round Diligence',
  title,
  description,
  metaChips,
  onStartPress,
  style,
}: FeaturedChallengeCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Top Image Banner */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.slate }]} />
        )}
        <View style={styles.tagsOverlay}>
          <TagChip label={tagLabel} variant="orange" />
          {categoryLabel ? (
            <TagChip
              label={categoryLabel}
              variant="translucent"
              style={{ marginLeft: spacing.xs }}
            />
          ) : null}
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={[typography.title2, styles.title]}>{title}</Text>
        <Text style={[typography.body, styles.desc]}>{description}</Text>

        {/* 2x2 MetaChip Grid */}
        <View style={styles.metaGrid}>
          {metaChips.map((chip, idx) => (
            <MetaChip key={idx} label={chip} style={styles.gridChip} />
          ))}
        </View>

        {/* CTA Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          showTrailingArrow
          onPress={onStartPress}
          style={{ marginTop: spacing.md }}
        >
          Start Challenge
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
    height: 160,
    width: '100%',
    backgroundColor: palette.slate,
    position: 'relative',
  },
  tagsOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    padding: spacing.lg,
  },
  title: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  desc: {
    color: palette.mutedOnLight,
    marginBottom: spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gridChip: {
    flexBasis: '48%',
    marginBottom: 0,
  },
});
