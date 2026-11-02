import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@sofe/shared';

export interface GradientOverlayProps {
  topColor?: string;
  topOpacity?: number;
  bottomColor?: string;
  bottomOpacity?: number;
  style?: ViewStyle;
}

/**
 * High-performance vector linear gradient overlay for hero cards and images.
 * Uses react-native-svg with zero native dependencies.
 */
export function GradientOverlay({
  topColor = palette.navy,
  topOpacity = 0,
  bottomColor = palette.navy,
  bottomOpacity = 0.85,
  style,
}: GradientOverlayProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg height="100%" width="100%">
        <Defs>
          <SvgLinearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={topColor} stopOpacity={topOpacity} />
            <Stop offset="0.5" stopColor={bottomColor} stopOpacity={bottomOpacity * 0.4} />
            <Stop offset="1" stopColor={bottomColor} stopOpacity={bottomOpacity} />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#darkGrad)" />
      </Svg>
    </View>
  );
}
