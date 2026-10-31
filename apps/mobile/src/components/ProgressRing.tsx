import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/theme-context';
import { typography } from '../theme/typography';

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showPercent?: boolean;
  testID?: string;
}

export function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 6,
  showPercent = true,
  testID,
}: ProgressRingProps) {
  const { colors, palette } = useTheme();

  const clamped = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  return (
    <View testID={testID} style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.orange}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          origin={`${size / 2}, ${size / 2}`}
          rotation="-90"
        />
      </Svg>
      {showPercent && (
        <View style={styles.labelContainer}>
          <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
            {Math.round(clamped)}%
          </Text>
        </View>
      )}
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
});
