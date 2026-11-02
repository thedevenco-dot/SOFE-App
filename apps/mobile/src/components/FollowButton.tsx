import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface FollowButtonProps {
  isFollowing?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Follow toggle button matching DESIGN_V2.md.
 * Default: Outlined cream/white with "+ Follow".
 * Active: Orange fill with bold navy "✓ Following".
 */
export function FollowButton({ isFollowing = false, onPress, style }: FollowButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isFollowing }}
      style={[
        styles.button,
        {
          backgroundColor: isFollowing ? palette.orange : palette.white,
          borderColor: isFollowing ? palette.orange : palette.line,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.caption,
          styles.text,
          {
            color: isFollowing ? palette.navy : palette.navy,
            fontWeight: isFollowing ? '700' : '600',
          },
        ]}
      >
        {isFollowing ? '✓ Following' : '+ Follow'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  text: {
    textAlign: 'center',
  },
});
