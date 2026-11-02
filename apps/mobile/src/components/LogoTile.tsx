import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface LogoTileProps {
  size?: number;
  style?: ViewStyle;
}

/**
 * Temporary SOFE monogram logo tile built from tokens.
 * Orange rounded square with bold serif "S".
 */
export function LogoTile({ size = 28, style }: LogoTileProps) {
  const borderRadius = Math.round(size * 0.28);
  const fontSize = Math.round(size * 0.65);

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: palette.orange,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="SOFE Logo"
    >
      <Text
        style={[
          typography.title2,
          styles.text,
          {
            fontSize,
            lineHeight: size,
            color: palette.navy,
          },
        ]}
      >
        S
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
