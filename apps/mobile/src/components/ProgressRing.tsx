import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercent?: boolean;
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * ProgressRing matching DESIGN_V2.md.
 * SVG circular ring with customizable centre label (e.g. "2/3" or percentage).
 */
export function ProgressRing({
  progress,
  size = 54,
  strokeWidth = 5,
  label,
  showPercent = true,
  trackColor = palette.track,
  fillColor = palette.orange,
  style,
  testID,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  const displayLabel = label || (showPercent ? `${Math.round(clamped)}%` : '');

  return (
    <View testID={testID} style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          origin={`${size / 2}, ${size / 2}`}
          rotation="-90"
        />
      </Svg>
      {displayLabel ? (
        <View style={styles.labelContainer}>
          <Text
            style={[
              typography.caption,
              styles.labelText,
              { fontSize: Math.max(10, Math.round(size * 0.22)) },
            ]}
          >
            {displayLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    color: palette.navy,
    fontWeight: '700',
  },
});
