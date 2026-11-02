import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface TaskRowProps {
  title: string;
  subtitle?: string;
  minutes?: number;
  points?: number;
  isCompleted?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
}

/**
 * Daily Protocol task row matching DESIGN_V2.md.
 * Interactive check circle:
 * - Done: Orange check fill, strikethrough title, "+25 pts" right
 * - Pending: Outlined circle, bold title, minutes right, subtitle below
 */
export function TaskRow({
  title,
  subtitle,
  minutes = 15,
  points = 25,
  isCompleted = false,
  onToggle,
  style,
}: TaskRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isCompleted }}
      accessibilityLabel={`${title}, ${isCompleted ? 'completed' : 'pending'}`}
      style={[styles.container, style]}
    >
      {/* Check Circle */}
      <View style={[styles.checkCircle, isCompleted ? styles.checkDone : styles.checkPending]}>
        {isCompleted ? <Check size={14} color={palette.navy} strokeWidth={3} /> : null}
      </View>

      {/* Title & Subtitle */}
      <View style={styles.textCol}>
        <Text style={[typography.bodyStrong, styles.title, isCompleted && styles.titleDone]}>
          {title}
        </Text>
        {subtitle && !isCompleted ? (
          <Text style={[typography.caption, styles.subtitle]}>{subtitle}</Text>
        ) : null}
      </View>

      {/* Trailing: Points or Minutes */}
      <View style={styles.trailing}>
        {isCompleted ? (
          <Text style={[typography.caption, styles.pointsText]}>+{points} pts</Text>
        ) : (
          <Text style={[typography.caption, styles.minutesText]}>{minutes}m</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 56,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkPending: {
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: 'transparent',
  },
  checkDone: {
    backgroundColor: palette.orange,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: palette.navy,
  },
  titleDone: {
    color: palette.mutedOnLight,
    textDecorationLine: 'line-through',
  },
  subtitle: {
    color: palette.mutedOnLight,
    marginTop: 2,
  },
  trailing: {
    marginLeft: spacing.sm,
  },
  pointsText: {
    color: palette.orangeDeep,
    fontWeight: '700',
  },
  minutesText: {
    color: palette.mutedOnLight,
    fontWeight: '600',
  },
});
