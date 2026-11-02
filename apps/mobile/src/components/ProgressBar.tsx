import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius as defaultRadius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface ProgressBarProps {
  /**
   * Progress value between 0 and 1 (or 0 to 100).
   */
  progress: number;
  height?: number;
  leftLabel?: string;
  rightLabel?: string;
  onDark?: boolean;
  trackColor?: string;
  fillColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Standard ProgressBar matching DESIGN_V2.md.
 * Height 6, pill radius, orange fill on beige track (or slate track on dark).
 * Optional left and right meta labels.
 */
export function ProgressBar({
  progress,
  height = 6,
  leftLabel,
  rightLabel,
  onDark = false,
  trackColor,
  fillColor,
  style,
  testID,
}: ProgressBarProps) {
  // Normalize progress to a 0 - 1 range
  const normalized = progress > 1 ? progress / 100 : progress;
  const clamped = Math.min(1, Math.max(0, normalized));

  const resolvedTrack = trackColor || (onDark ? palette.slate : palette.track);
  const resolvedFill = fillColor || palette.orange;

  const hasLabels = Boolean(leftLabel || rightLabel);

  return (
    <View testID={testID} style={[styles.wrapper, style]}>
      {hasLabels ? (
        <View style={styles.labelRow}>
          {leftLabel ? (
            <Text
              style={[
                typography.caption,
                { color: onDark ? palette.mutedOnDark : palette.mutedOnLight },
              ]}
            >
              {leftLabel}
            </Text>
          ) : (
            <View />
          )}
          {rightLabel ? (
            <Text
              style={[
                typography.caption,
                styles.rightLabelText,
                { color: onDark ? palette.orange : palette.navy },
              ]}
            >
              {rightLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: resolvedTrack,
            borderRadius: defaultRadius.pill,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${(clamped * 100).toFixed(1)}%` as unknown as number,
              height,
              backgroundColor: resolvedFill,
              borderRadius: defaultRadius.pill,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rightLabelText: {
    fontWeight: '700',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
