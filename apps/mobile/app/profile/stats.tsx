import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Button, ProgressRing } from '../../src/components';
import { profileApi } from '../../src/lib/profile-api';
import type { UserStatsResponseDto } from '@sofe/shared';

export default function ProfileStatsScreen() {
  const { colors, palette, spacing, radius } = useTheme();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatsResponseDto | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await profileApi.getMyStats();
        setStats(res);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const totalWeeklyMin = (stats?.learningTimeChart || []).reduce((acc, d) => acc + d.minutes, 0);
  const avgDailyMin = Math.round(totalWeeklyMin / 7);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { borderBottomColor: colors.border, padding: spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.bodyStrong, { color: palette.orange }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[typography.title3, { color: colors.text }]}>Learning Analytics</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
          {/* Progress Overview Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[typography.title3, { color: colors.text }]}>Curriculum Mastery</Text>
            <View style={[styles.ringRow, { marginTop: spacing.md }]}>
              <ProgressRing
                progress={stats?.progressRing.percent ?? 0}
                size={84}
                strokeWidth={8}
                fillColor={palette.orange}
                trackColor={colors.border}
              />
              <View style={styles.ringInfo}>
                <Text style={[typography.title1, { color: palette.orange }]}>
                  {stats?.progressRing.percent ?? 0}%
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}
                >
                  {stats?.progressRing.completedCourses ?? 0} of{' '}
                  {stats?.progressRing.totalCourses ?? 0} courses finished
                </Text>
                <Text
                  style={[typography.captionStrong, { color: colors.text, marginTop: spacing.xs }]}
                >
                  {stats?.progressRing.hoursWatched ?? 0} hours total watch time
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Consistency Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.md,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[typography.title3, { color: colors.text }]}>Weekly Time Investment</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
              Total {totalWeeklyMin} minutes logged this week (avg {avgDailyMin}m/day)
            </Text>

            <View style={[styles.chartContainer, { marginTop: spacing.lg }]}>
              {(stats?.learningTimeChart || []).map((day, idx) => {
                const maxMin = Math.max(
                  60,
                  ...(stats?.learningTimeChart.map((d) => d.minutes) || [60]),
                );
                const barHeight = Math.max(8, Math.round((day.minutes / maxMin) * 80));
                const isToday = idx === (stats?.learningTimeChart.length || 0) - 1;

                return (
                  <View key={day.dateKey} style={styles.chartCol}>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textMuted, marginBottom: spacing.xs },
                      ]}
                    >
                      {day.minutes > 0 ? `${day.minutes}m` : '0'}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: barHeight,
                            backgroundColor:
                              day.minutes > 0
                                ? isToday
                                  ? palette.orange
                                  : palette.peachTint
                                : colors.border,
                            borderRadius: radius.sm,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        typography.captionStrong,
                        {
                          color: isToday ? palette.orange : colors.textMuted,
                          marginTop: spacing.xs,
                        },
                      ]}
                    >
                      {day.dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Practice & Quizzes Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.md,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[typography.title3, { color: colors.text }]}>Practice & Retrieval</Text>

            <View style={[styles.grid, { marginTop: spacing.md }]}>
              <View style={styles.gridItem}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  Quizzes Completed
                </Text>
                <Text style={[typography.title2, { color: colors.text, marginTop: spacing.xs }]}>
                  {stats?.practiceStats.quizzesCompleted ?? 0}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  Average Quiz Score
                </Text>
                <Text style={[typography.title2, { color: colors.success, marginTop: spacing.xs }]}>
                  {stats?.practiceStats.avgScorePercent ?? 0}%
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  Current Daily Streak
                </Text>
                <Text style={[typography.title2, { color: palette.orange, marginTop: spacing.xs }]}>
                  {stats?.practiceStats.currentStreak ?? 0} days
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  Longest Daily Streak
                </Text>
                <Text style={[typography.title2, { color: colors.text, marginTop: spacing.xs }]}>
                  {stats?.practiceStats.longestStreak ?? 0} days
                </Text>
              </View>
            </View>
          </View>

          {/* Points Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.md,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.pointsRow}>
              <View>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  Reward Points Balance
                </Text>
                <Text style={[typography.title1, { color: palette.gold, marginTop: spacing.xs }]}>
                  ⭐ {stats?.practiceStats.totalPoints ?? 0} pts
                </Text>
              </View>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => router.push('/practise/points-history')}
              >
                View History
              </Button>
            </View>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  content: {
    flexGrow: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringInfo: {
    flex: 1,
    marginLeft: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: 80,
    width: 16,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
