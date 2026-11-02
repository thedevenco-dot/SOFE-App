import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { palette, colorRoles, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  hasOrangeBar?: boolean;
  rightElement?: React.ReactNode;
  subtitle?: string;
  style?: ViewStyle;
}

/**
 * Standard SectionHeader matching DESIGN_V2.md Section 5.
 * Left: Serif title2 (+ optional orange vertical bar).
 * Right: Eyebrow-style action link in accent.text (orangeDeep).
 */
export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  hasOrangeBar = false,
  rightElement,
  subtitle,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {/* Title Group */}
        <View style={styles.leftGroup}>
          {hasOrangeBar ? <View style={styles.orangeBar} /> : null}
          <Text style={[typography.title2, styles.title]}>{title}</Text>
        </View>

        {/* Right Element or Action Link */}
        {rightElement ? (
          rightElement
        ) : actionLabel ? (
          <TouchableOpacity
            onPress={onActionPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[typography.eyebrow, styles.actionText]}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Optional Subtitle */}
      {subtitle ? <Text style={[typography.body, styles.subtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orangeBar: {
    width: 4,
    height: 20,
    backgroundColor: palette.orange,
    marginRight: spacing.sm,
    borderRadius: 2,
  },
  title: {
    color: palette.navy,
  },
  actionText: {
    color: colorRoles.accentText, // Orange text on light uses orangeDeep
    fontWeight: '700',
  },
  subtitle: {
    color: palette.mutedOnLight,
    marginTop: 4,
  },
});
