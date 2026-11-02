import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Zap } from 'lucide-react-native';
import { palette, radius, shadows, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';
import { EyebrowLabel } from './EyebrowLabel';
import { Button } from './Button';

export interface QuickQuizCardProps {
  eyebrow: string;
  title: string;
  description: string;
  scenariosCount?: number;
  minutes?: number;
  points?: number;
  onBeginPress?: () => void;
  style?: ViewStyle;
}

/**
 * Rapid Calibration Quiz Card matching DESIGN_V2.md.
 * Eyebrow with icon, serif title, description, meta summary row, dark pill button ("Begin Quiz").
 */
export function QuickQuizCard({
  eyebrow,
  title,
  description,
  scenariosCount = 5,
  minutes = 4,
  points = 25,
  onBeginPress,
  style,
}: QuickQuizCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Top Eyebrow with Zap Icon */}
      <View style={styles.eyebrowRow}>
        <Zap size={14} color={palette.orange} fill={palette.orange} />
        <EyebrowLabel style={{ marginLeft: 4 }}>{eyebrow}</EyebrowLabel>
      </View>

      {/* Title & Description */}
      <Text style={[typography.title2, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.desc]}>{description}</Text>

      {/* Bottom Row: Meta Stats + Dark Pill Button */}
      <View style={styles.bottomRow}>
        <Text style={[typography.caption, styles.metaText]}>
          {scenariosCount} Scenarios · {minutes} mins · +{points} pts
        </Text>

        <Button variant="dark" size="sm" pill onPress={onBeginPress}>
          Begin Quiz
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    color: palette.navy,
    marginBottom: spacing.xs,
  },
  desc: {
    color: palette.mutedOnLight,
    marginBottom: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  metaText: {
    color: palette.mutedOnLight,
    fontWeight: '600',
  },
});
