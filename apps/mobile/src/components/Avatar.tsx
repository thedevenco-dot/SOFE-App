import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';

export type AvatarSize = 24 | 32 | 44 | 96;

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  isVerified?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function getInitials(name?: string): string {
  if (!name) return 'F';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ uri, name, size = 44, isVerified = false, style, testID }: AvatarProps) {
  const { palette } = useTheme();

  const initials = getInitials(name);
  const fontSize = size === 96 ? 36 : size === 44 ? 16 : size === 32 ? 12 : 9;
  const badgeSize = size === 96 ? 24 : size === 44 ? 14 : size === 32 ? 10 : 8;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.navy,
          borderColor: palette.orange,
          borderWidth: size >= 44 ? 2 : 1,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize, color: palette.orange }]}>{initials}</Text>
      )}

      {isVerified && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: palette.gold,
              borderColor: palette.navy,
              borderWidth: 1.5,
            },
          ]}
        >
          <Check size={badgeSize * 0.7} color={palette.navy} strokeWidth={3} />
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
  initials: {
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
