import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../theme/typography';

export interface OfflineBannerProps {
  message?: string;
  style?: ViewStyle;
}

/**
 * Offline status banner displayed when internet connection is lost.
 * Yellow/gold subtle bar with wifi-off icon.
 */
export function OfflineBanner({
  message = 'You are currently offline. Saved playbooks and cached lessons remain accessible.',
  style,
}: OfflineBannerProps) {
  return (
    <View style={[styles.banner, style]}>
      <WifiOff size={16} color={palette.navy} style={{ marginRight: spacing.sm }} />
      <Text style={[typography.caption, styles.text]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: palette.peachTint,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    color: palette.navy,
    flex: 1,
    fontWeight: '500',
  },
});
