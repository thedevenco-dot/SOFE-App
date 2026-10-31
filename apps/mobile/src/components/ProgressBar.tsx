import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme-context';

export interface ProgressBarProps {
  /**
   * Progress value between 0 and 1 (or 0 to 100).
   */
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  trackColor,
  fillColor,
  style,
  testID,
}: ProgressBarProps) {
  const { colors, palette, radius } = useTheme();

  // Normalize progress to a 0 - 1 range
  const normalized = progress > 1 ? progress / 100 : progress;
  const clamped = Math.min(1, Math.max(0, normalized));
  const percentString = `${(clamped * 100).toFixed(1)}%`;

  const resolvedTrack = trackColor || colors.border;
  const resolvedFill = fillColor || palette.orange;

  return (
    <View
      testID={testID}
      style={[
        styles.track,
        {
          height,
          backgroundColor: resolvedTrack,
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: percentString as unknown as number,
            height,
            backgroundColor: resolvedFill,
            borderRadius: radius.pill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
