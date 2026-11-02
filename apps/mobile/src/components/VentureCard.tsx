import React from 'react';
import { ExternalLink } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { TagChip } from './TagChip';

export interface VentureCardProps {
  imageUri?: string;
  tagLabel?: string;
  title: string;
  description: string;
  tags?: string[];
  onOpenLink?: () => void;
  style?: ViewStyle;
}

/**
 * VentureCard for founder portfolio projects (Profile).
 * Dark card with image, TagChip, serif title, description, tag pills, and external link icon.
 */
export function VentureCard({
  imageUri,
  tagLabel = 'PROJECT 01',
  title,
  description,
  tags = ['B2B SaaS', 'Seed Stage'],
  onOpenLink,
  style,
}: VentureCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Top Image Banner */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.slate }]} />
        )}
        <View style={styles.tagWrapper}>
          <TagChip label={tagLabel} variant="orange" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[typography.title2, styles.title]}>{title}</Text>
          {onOpenLink ? (
            <TouchableOpacity onPress={onOpenLink} accessibilityLabel="Open venture website">
              <ExternalLink size={18} color={palette.orange} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[typography.body, styles.desc]}>{description}</Text>

        {/* Tag Pills */}
        <View style={styles.tagsRow}>
          {tags.map((t, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={[typography.caption, styles.tagText]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.navy,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: palette.slate,
    position: 'relative',
  },
  tagWrapper: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    color: palette.white,
  },
  desc: {
    color: palette.mutedOnDark,
    marginBottom: spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagPill: {
    backgroundColor: palette.slate,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: {
    color: palette.white,
    fontSize: 11,
  },
});
