import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { palette, radius } from '@sofe/shared';
import { typography } from '../theme/typography';

export type AvatarSize = 24 | 32 | 44 | 96;

export interface AvatarProps {
  uri?: string | null;
  url?: string | null; // Compatibility alias
  name?: string;
  size?: AvatarSize;
  isVerified?: boolean;
  hasOrangeRing?: boolean;
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

/**
 * Avatar with sizes 24 / 32 / 44 / 96.
 * Supports image, initials fallback, orange ring variant, and verified badge.
 */
export function Avatar({
  uri,
  url,
  name,
  size = 44,
  isVerified = false,
  hasOrangeRing = false,
  style,
  testID,
}: AvatarProps) {
  const imageSource = url || uri;
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
          backgroundColor: palette.slate,
          borderColor: hasOrangeRing ? palette.orange : palette.slate,
          borderWidth: hasOrangeRing ? (size >= 44 ? 2 : 1.5) : 0,
        },
        style,
      ]}
    >
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={{
            width: size - (hasOrangeRing ? 4 : 0),
            height: size - (hasOrangeRing ? 4 : 0),
            borderRadius: size / 2,
          }}
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
              backgroundColor: palette.navy,
              borderColor: palette.white,
              borderWidth: 1.5,
            },
          ]}
        >
          <Check size={badgeSize * 0.7} color={palette.orange} strokeWidth={3} />
        </View>
      )}
    </View>
  );
}

export interface AvatarStackProps {
  avatars: Array<{ name?: string; url?: string; uri?: string }>;
  maxVisible?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

/**
 * AvatarStack component with overlapping avatars and "+N" overflow count badge.
 */
export function AvatarStack({ avatars, maxVisible = 3, size = 24, style }: AvatarStackProps) {
  const visible = avatars.slice(0, maxVisible);
  const overflow = avatars.length - maxVisible;

  return (
    <View style={[styles.stackRow, style]}>
      {visible.map((item, idx) => (
        <View
          key={idx}
          style={[
            styles.stackItem,
            {
              marginLeft: idx === 0 ? 0 : -(size * 0.3),
              zIndex: visible.length - idx,
            },
          ]}
        >
          <Avatar size={size} name={item.name} url={item.url || item.uri} hasOrangeRing />
        </View>
      ))}

      {overflow > 0 ? (
        <View
          style={[
            styles.overflowBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.3),
              zIndex: 0,
            },
          ]}
        >
          <Text style={[typography.caption, styles.overflowText]}>+{overflow}</Text>
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
    overflow: 'hidden',
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
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackItem: {
    borderWidth: 1.5,
    borderColor: palette.white,
    borderRadius: radius.pill,
  },
  overflowBadge: {
    backgroundColor: palette.slate,
    borderWidth: 1.5,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 10,
  },
});
