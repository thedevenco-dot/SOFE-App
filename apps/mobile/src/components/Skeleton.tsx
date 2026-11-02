import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { palette, radius as defaultRadius, spacing } from '@sofe/shared';
import { useTheme } from '../theme/theme-context';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  testID,
}: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  const bg = isDark ? colors.surfaceRaised : palette.track;

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: borderRadius !== undefined ? borderRadius : defaultRadius.sm,
          backgroundColor: bg,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton placeholder that mirrors CourseCardLarge / HeroImageCard layout.
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.cardPlaceholder, style]}>
      <Skeleton
        height={160}
        borderRadius={defaultRadius.card}
        style={{ marginBottom: spacing.md }}
      />
      <Skeleton width="40%" height={12} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="90%" height={20} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="70%" height={14} style={{ marginBottom: spacing.md }} />
      <Skeleton width="100%" height={44} borderRadius={defaultRadius.button} />
    </View>
  );
}

/**
 * Skeleton placeholder that mirrors CourseCardRow / TaskRow layout.
 */
export function SkeletonRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.rowPlaceholder, style]}>
      <Skeleton
        width={64}
        height={64}
        borderRadius={defaultRadius.sm}
        style={{ marginRight: spacing.md }}
      />
      <View style={{ flex: 1 }}>
        <Skeleton width="50%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width="85%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardPlaceholder: {
    backgroundColor: palette.white,
    borderRadius: defaultRadius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rowPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: defaultRadius.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
