import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../src/theme/theme-context';
import { typography } from '../../../src/theme/typography';
import { Button } from '../../../src/components';
import { profileApi } from '../../../src/lib/profile-api';
import type { LearnerAchievementItemDto } from '@sofe/shared';

export default function AchievementDetailModal() {
  const { colors, palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [achievement, setAchievement] = useState<LearnerAchievementItemDto | null>(null);

  useEffect(() => {
    async function loadAchievement() {
      try {
        const res = await profileApi.getAchievements();
        const found = res.items.find((a) => a.id === id || a.key === id);
        if (found) {
          setAchievement(found);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadAchievement();
  }, [id]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return palette.navy;
      case 'gold':
        return palette.gold;
      case 'silver':
        return colors.textMuted;
      default:
        return palette.orange;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { padding: spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.bodyStrong, { color: colors.textMuted }]}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : achievement ? (
        <View style={[styles.content, { padding: spacing.xl }]}>
          {/* Badge Visual Ring */}
          <View
            style={[
              styles.badgeGlowRing,
              {
                backgroundColor: achievement.unlocked ? palette.peachTint : colors.border,
                borderRadius: radius.pill,
                borderColor: achievement.unlocked ? getTierColor(achievement.tier) : colors.border,
                borderWidth: 3,
              },
            ]}
          >
            <Text
              style={[
                typography.display,
                { color: achievement.unlocked ? palette.orange : colors.textMuted },
              ]}
            >
              {achievement.unlocked ? '🏆' : '🔒'}
            </Text>
          </View>

          {/* Title & Tier */}
          <Text
            style={[
              typography.title1,
              { color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
            ]}
          >
            {achievement.title}
          </Text>

          <View style={[styles.pillRow, { marginTop: spacing.sm }]}>
            <View
              style={[
                styles.tierPill,
                {
                  backgroundColor: getTierColor(achievement.tier),
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.captionStrong, { color: colors.surface }]}>
                {achievement.tier.toUpperCase()} TIER
              </Text>
            </View>

            <View
              style={[
                styles.pointsPill,
                {
                  backgroundColor: colors.surface,
                  borderColor: palette.gold,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.captionStrong, { color: palette.gold }]}>
                +{achievement.tier === 'gold' ? 50 : achievement.tier === 'platinum' ? 100 : 25} PTS
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            style={[
              typography.body,
              {
                color: colors.textMuted,
                marginTop: spacing.lg,
                textAlign: 'center',
                lineHeight: 22,
              },
            ]}
          >
            {achievement.description}
          </Text>

          {/* Status Box */}
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.xl,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            {achievement.unlocked ? (
              <View style={styles.unlockedBox}>
                <Text style={[typography.title3, { color: colors.success }]}>
                  ✓ Achievement Unlocked!
                </Text>
                {achievement.unlockedAt ? (
                  <Text
                    style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}
                  >
                    Earned on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.lockedBox}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  Progress: {achievement.progress?.current ?? 0} /{' '}
                  {achievement.progress?.threshold ?? 1} ({achievement.progress?.percent ?? 0}%)
                </Text>
                <View
                  style={[
                    styles.track,
                    {
                      backgroundColor: colors.border,
                      borderRadius: radius.pill,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${achievement.progress?.percent ?? 0}%`,
                        backgroundColor: palette.orange,
                        borderRadius: radius.pill,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          <Button
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.xl, width: '100%' }}
            onPress={() => router.back()}
          >
            Done
          </Button>
        </View>
      ) : (
        <View style={styles.centerBox}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Achievement not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  badgeGlowRing: {
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pointsPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBox: {
    width: '100%',
  },
  unlockedBox: {
    alignItems: 'center',
  },
  lockedBox: {
    width: '100%',
  },
  track: {
    height: 8,
    width: '100%',
  },
  fill: {
    height: 8,
  },
});
