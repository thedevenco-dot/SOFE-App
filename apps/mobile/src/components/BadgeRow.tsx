import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Award } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface BadgeRowProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  style?: ViewStyle;
}

/**
 * Fellow Badge Row for Profile & Accreditation lists.
 * bg.tint panel with circular navy icon, bold title, muted description.
 */
export function BadgeRow({ icon, title, description, style }: BadgeRowProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Navy Icon Circle */}
      <View style={styles.iconCircle}>{icon || <Award size={20} color={palette.orange} />}</View>

      {/* Title & Description */}
      <View style={styles.textCol}>
        <Text style={[typography.bodyStrong, styles.title]}>{title}</Text>
        <Text style={[typography.caption, styles.desc]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.peachTint,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: palette.navy,
  },
  desc: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
});
