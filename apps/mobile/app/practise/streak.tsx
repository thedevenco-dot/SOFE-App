import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Award, ShieldCheck, Clock, ArrowRight } from 'lucide-react-native';
import { colorRoles, palette, radius, spacing, type StreakStatusDto } from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { WeeklyConsistency, type DayData } from '../../src/components/WeeklyConsistency';
import { practiseApi } from '../../src/lib/practise-api';

export default function StreakHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streakData, setStreakData] = useState<StreakStatusDto | null>(null);

  const loadStreak = useCallback(async () => {
    try {
      const data = await practiseApi.getStreakStatus();
      setStreakData(data);
    } catch {
      // Fallback
      setStreakData({
        current: 5,
        longest: 12,
        isActiveToday: true,
        todayDateKey: '2026-11-04',
        recentDays: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStreak();
  }, [loadStreak]);

  const current = streakData?.current ?? 0;
  const longest = streakData?.longest ?? 0;
  const isActiveToday = streakData?.isActiveToday ?? false;

  const daysRow: DayData[] = [
    { dayLabel: 'M', status: current >= 1 ? 'done' : 'today' },
    { dayLabel: 'T', status: current >= 2 ? 'done' : 'upcoming' },
    { dayLabel: 'W', status: current >= 3 ? 'done' : 'upcoming' },
    { dayLabel: 'T', status: current >= 4 ? 'done' : 'upcoming' },
    { dayLabel: 'F', status: current >= 5 ? 'done' : 'upcoming' },
    { dayLabel: 'S', status: current >= 6 ? 'done' : 'upcoming' },
    { dayLabel: 'S', status: current >= 7 ? 'done' : 'upcoming' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.navy} />
          </View>
        ) : (
          <>
            {/* Streak Hero Card */}
            <Card variant="white" padding={spacing.lg} style={styles.heroCard}>
              <View style={styles.flameCircle}>
                <Flame size={44} color={palette.orange} fill={palette.orange} />
              </View>

              <Text style={[typography.hero, styles.heroNumber, { color: palette.navy }]}>
                {current}
              </Text>
              <Text style={[typography.title2, styles.heroLabel, { color: palette.navy }]}>
                Day Learning Streak
              </Text>

              <Text style={[typography.body, styles.heroSub, { color: palette.mutedOnLight }]}>
                {isActiveToday
                  ? "You've completed practice today! Keep the momentum tomorrow."
                  : 'Complete 1 practice drill or lesson today to maintain your streak.'}
              </Text>

              {/* Stats Row */}
              <View style={[styles.statsRow, { borderColor: palette.line }]}>
                <View style={styles.statCol}>
                  <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                    Longest Streak
                  </Text>
                  <Text style={[typography.title2, { color: palette.navy, marginTop: spacing.xs }]}>
                    {longest} Days
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: palette.line }]} />
                <View style={styles.statCol}>
                  <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                    Today&apos;s Status
                  </Text>
                  <Text
                    style={[
                      typography.title2,
                      {
                        color: isActiveToday ? colorRoles.successOnLight : palette.orange,
                        marginTop: spacing.xs,
                      },
                    ]}
                  >
                    {isActiveToday ? 'Protected' : 'Pending'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Consistency Tracker */}
            <View style={styles.sectionHeader}>
              <Text style={[typography.title3, { color: colors.text }]}>7-Day Tracker</Text>
            </View>

            <Card variant="outlined" padding={spacing.md} style={styles.consistencyCard}>
              <WeeklyConsistency
                days={daysRow}
                currentMinutes={isActiveToday ? 45 : 15}
                targetMinutes={45}
              />
            </Card>

            {/* Streak Rules & Milestones */}
            <View style={styles.sectionHeader}>
              <Text style={[typography.title3, { color: colors.text }]}>
                Streak Rules & Milestones
              </Text>
            </View>

            <Card variant="outlined" padding={spacing.md} style={styles.rulesCard}>
              <View style={styles.ruleItem}>
                <ShieldCheck size={20} color={colorRoles.successOnLight} />
                <View style={styles.ruleTextCol}>
                  <Text style={[typography.body, { color: palette.navy, fontWeight: '600' }]}>
                    How Streak Increments
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.mutedOnLight, marginTop: spacing.xs },
                    ]}
                  >
                    Complete at least one Quick Quiz, Daily Reflection, or Course Lesson before
                    midnight in your local timezone.
                  </Text>
                </View>
              </View>

              <View style={[styles.ruleDivider, { backgroundColor: palette.line }]} />

              <View style={styles.ruleItem}>
                <Clock size={20} color={palette.orange} />
                <View style={styles.ruleTextCol}>
                  <Text style={[typography.body, { color: palette.navy, fontWeight: '600' }]}>
                    Timezone Rollover
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.mutedOnLight, marginTop: spacing.xs },
                    ]}
                  >
                    Streaks rollover automatically at 12:00 AM local time. If you miss a day without
                    an active freeze, streak resets to 0.
                  </Text>
                </View>
              </View>

              <View style={[styles.ruleDivider, { backgroundColor: palette.line }]} />

              <View style={styles.ruleItem}>
                <Award size={20} color={palette.gold} />
                <View style={styles.ruleTextCol}>
                  <Text style={[typography.body, { color: palette.navy, fontWeight: '600' }]}>
                    Milestone Badges
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.mutedOnLight, marginTop: spacing.xs },
                    ]}
                  >
                    Unlocks: 7-Day Founder Habit (50 bonus pts), 30-Day Relentless (250 bonus pts),
                    and 100-Day Centurion.
                  </Text>
                </View>
              </View>
            </Card>

            {/* Action */}
            <Button
              variant="primary"
              size="lg"
              pill
              onPress={() => router.push('/(tabs)/practise' as never)}
              style={styles.actionButton}
            >
              <Text style={[typography.body, { color: palette.cream, fontWeight: '600' }]}>
                Continue Today&apos;s Practice
              </Text>
              <ArrowRight size={16} color={palette.cream} style={{ marginLeft: spacing.xs }} />
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: palette.cream,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.xl,
  },
  flameCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroNumber: {
    marginVertical: spacing.xs,
  },
  heroLabel: {
    marginBottom: spacing.xs,
  },
  heroSub: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  consistencyCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.xl,
  },
  rulesCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.xl,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  ruleTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  ruleDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
