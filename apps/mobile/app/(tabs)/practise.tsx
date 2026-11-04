import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Flame,
  Zap,
  Gift,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react-native';
import { colorRoles, palette, radius, spacing, type PracticeTodayResponse } from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { WeeklyConsistency, type DayData } from '../../src/components/WeeklyConsistency';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { practiseApi, type PracticeHistoryItem } from '../../src/lib/practise-api';

export default function PractiseScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayData, setTodayData] = useState<PracticeTodayResponse | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [todayRes, balanceRes, historyRes] = await Promise.all([
        practiseApi.getTodayPractice().catch(() => null),
        practiseApi.getPointsBalance().catch(() => ({ balance: 0 })),
        practiseApi.getPracticeHistory(5).catch(() => []),
      ]);

      if (todayRes) setTodayData(todayRes);
      if (balanceRes) setPointsBalance(balanceRes.balance);
      if (historyRes) setHistory(historyRes);
    } catch {
      // Graceful fallback to cached/initial state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const streak = todayData?.streak || { current: 0, longest: 0, isActiveToday: false };
  const slots = todayData?.schedule?.slots || [];
  const quickQuiz = todayData?.quickQuiz;
  const quickQuizSlot = slots.find((s) => s.slotKey === 'quick_quiz');
  const reflectionSlot = slots.find((s) => s.slotKey === 'daily_reflection');

  // Convert streak / days to 7-day display
  const daysRow: DayData[] = [
    { dayLabel: 'M', status: streak.current >= 1 ? 'done' : 'today' },
    { dayLabel: 'T', status: streak.current >= 2 ? 'done' : 'upcoming' },
    { dayLabel: 'W', status: streak.current >= 3 ? 'done' : 'upcoming' },
    { dayLabel: 'T', status: streak.current >= 4 ? 'done' : 'upcoming' },
    { dayLabel: 'F', status: streak.current >= 5 ? 'done' : 'upcoming' },
    { dayLabel: 'S', status: streak.current >= 6 ? 'done' : 'upcoming' },
    { dayLabel: 'S', status: streak.current >= 7 ? 'done' : 'upcoming' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header Row with Points & Rewards Pills */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={[typography.title1, { color: colors.text }]}>Practise</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
              Deliberate daily micro-challenges
            </Text>
          </View>

          <View style={styles.actionChips}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/practise/points' as never)}
              style={[
                styles.chipButton,
                { backgroundColor: colors.surface, borderColor: palette.line },
              ]}
            >
              <Zap size={14} color={palette.gold} fill={palette.gold} />
              <Text style={[typography.caption, styles.chipText, { color: colors.text }]}>
                {pointsBalance} pts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/practise/rewards' as never)}
              style={[
                styles.chipButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: palette.line,
                  marginLeft: spacing.xs,
                },
              ]}
            >
              <Gift size={14} color={palette.orange} />
              <Text style={[typography.caption, styles.chipText, { color: colors.text }]}>
                Rewards
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.navy} />
          </View>
        ) : (
          <>
            {/* Streak & Consistency Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/practise/streak' as never)}
            >
              <Card variant="white" padding={spacing.lg} style={styles.streakCard}>
                <View style={styles.streakHeader}>
                  <View style={styles.streakTitleRow}>
                    <Flame size={22} color={palette.orange} fill={palette.orange} />
                    <Text
                      style={[typography.title2, { color: palette.navy, marginLeft: spacing.xs }]}
                    >
                      {streak.current} Day Streak
                    </Text>
                  </View>
                  <View style={styles.streakMetaRow}>
                    <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                      Best: {streak.longest}d
                    </Text>
                    <ChevronRight
                      size={16}
                      color={palette.mutedOnLight}
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                </View>

                {/* 7-Day Consistency Tracker */}
                <WeeklyConsistency
                  days={daysRow}
                  currentMinutes={streak.isActiveToday ? 45 : 15}
                  targetMinutes={45}
                  style={styles.consistencyRow}
                />
              </Card>
            </TouchableOpacity>

            {/* Today's Practice Section */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[typography.title3, { color: colors.text }]}>
                  Today&apos;s Workout
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {todayData?.schedule?.completedCount ?? 0} of {slots.length || 5} completed
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/practise/daily' as never)}
                style={styles.viewAllRow}
              >
                <Text style={[typography.caption, { color: palette.orange }]}>View Schedule</Text>
                <ChevronRight size={14} color={palette.orange} />
              </TouchableOpacity>
            </View>

            {/* Slot 1: Quick Quiz Card */}
            <Card variant="outlined" padding={spacing.md} style={styles.slotCard}>
              <View style={styles.slotTopRow}>
                <View style={styles.slotEyebrow}>
                  <Zap size={14} color={palette.orange} fill={palette.orange} />
                  <Text
                    style={[typography.caption, { color: palette.orange, marginLeft: spacing.xs }]}
                  >
                    QUICK QUIZ · +50 PTS
                  </Text>
                </View>
                {quickQuizSlot?.done ? (
                  <View style={styles.doneBadge}>
                    <CheckCircle2 size={14} color={colorRoles.successOnLight} />
                    <Text
                      style={[
                        typography.caption,
                        { color: colorRoles.successOnLight, marginLeft: spacing.xs },
                      ]}
                    >
                      Score: {quickQuizSlot.score ?? 100}%
                    </Text>
                  </View>
                ) : (
                  <View style={styles.timeBadge}>
                    <Clock size={12} color={palette.mutedOnLight} />
                    <Text
                      style={[
                        typography.caption,
                        { color: palette.mutedOnLight, marginLeft: spacing.xs },
                      ]}
                    >
                      3 mins
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[typography.title3, styles.slotTitle, { color: palette.navy }]}>
                {quickQuizSlot?.title || quickQuiz?.title || 'Tactical Unit Economics Drill'}
              </Text>
              <Text style={[typography.body, styles.slotDesc, { color: palette.mutedOnLight }]}>
                Calibrate your founder decision speed with 3 rapid decision scenarios.
              </Text>

              <View style={styles.slotActionRow}>
                {quickQuizSlot?.done ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    pill
                    onPress={() => {
                      const qId = quickQuizSlot.refId || quickQuiz?.id || 'default';
                      router.push(`/practise/quiz/${qId}/result` as never);
                    }}
                  >
                    View Breakdown
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    pill
                    onPress={() => {
                      const qId = quickQuizSlot?.refId || quickQuiz?.id || 'default';
                      router.push(`/practise/quiz/${qId}` as never);
                    }}
                  >
                    Start Drill
                  </Button>
                )}
              </View>
            </Card>

            {/* Slot 5: Daily Reflection Card */}
            <Card variant="outlined" padding={spacing.md} style={styles.slotCard}>
              <View style={styles.slotTopRow}>
                <View style={styles.slotEyebrow}>
                  <Sparkles size={14} color={palette.gold} />
                  <Text
                    style={[typography.caption, { color: palette.gold, marginLeft: spacing.xs }]}
                  >
                    DAILY SYNTHESIS · +20 PTS
                  </Text>
                </View>
                {reflectionSlot?.done ? (
                  <View style={styles.doneBadge}>
                    <CheckCircle2 size={14} color={colorRoles.successOnLight} />
                    <Text
                      style={[
                        typography.caption,
                        { color: colorRoles.successOnLight, marginLeft: spacing.xs },
                      ]}
                    >
                      Completed
                    </Text>
                  </View>
                ) : (
                  <View style={styles.timeBadge}>
                    <Clock size={12} color={palette.mutedOnLight} />
                    <Text
                      style={[
                        typography.caption,
                        { color: palette.mutedOnLight, marginLeft: spacing.xs },
                      ]}
                    >
                      2 mins
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[typography.title3, styles.slotTitle, { color: palette.navy }]}>
                {reflectionSlot?.title || 'Executive Reflection Note'}
              </Text>
              <Text style={[typography.body, styles.slotDesc, { color: palette.mutedOnLight }]}>
                Synthesize today&apos;s key operational decisions and founder insights.
              </Text>

              <View style={styles.slotActionRow}>
                <Button
                  variant={reflectionSlot?.done ? 'secondary' : 'primary'}
                  size="sm"
                  pill
                  onPress={() => router.push('/practise/reflection' as never)}
                >
                  {reflectionSlot?.done ? 'Review Reflection' : 'Begin Reflection'}
                </Button>
              </View>
            </Card>

            {/* Teaser Slots: Cognitive Sprint & Match Concept (v1.5) */}
            <Card
              variant="outlined"
              padding={spacing.md}
              style={[styles.slotCard, styles.teaserCard]}
            >
              <View style={styles.slotTopRow}>
                <View style={styles.slotEyebrow}>
                  <BookOpen size={14} color={palette.mutedOnLight} />
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.mutedOnLight, marginLeft: spacing.xs },
                    ]}
                  >
                    COGNITIVE AGILITY & CHALLENGES
                  </Text>
                </View>
                <View style={styles.teaserBadge}>
                  <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                    v1.5 Teaser
                  </Text>
                </View>
              </View>
              <Text style={[typography.title3, styles.slotTitle, { color: palette.navy }]}>
                Mental Models Alignment & Scenario Battles
              </Text>
              <Text style={[typography.caption, styles.slotDesc, { color: palette.mutedOnLight }]}>
                Interactive match drills and multi-founder scenario simulations unlocking soon in
                Phase 7.
              </Text>
            </Card>

            {/* Recent History Card */}
            {history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={[typography.title3, { color: colors.text, marginBottom: spacing.sm }]}>
                  Recent Drills
                </Text>
                {history.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (item.quizId) {
                        router.push(`/practise/quiz/${item.quizId}/result` as never);
                      }
                    }}
                    style={[
                      styles.historyRow,
                      { backgroundColor: colors.surface, borderColor: palette.line },
                    ]}
                  >
                    <View style={styles.historyInfo}>
                      <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                        {item.quizTitle}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textMuted, marginTop: spacing.xs },
                        ]}
                      >
                        Score: {item.score}% · +{item.pointsAwarded} pts
                      </Text>
                    </View>
                    <ArrowRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  actionChips: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consistencyRow: {
    marginTop: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotCard: {
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderColor: palette.line,
    marginBottom: spacing.md,
  },
  teaserCard: {
    opacity: 0.85,
    borderStyle: 'dashed',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  slotEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.peachTint,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teaserBadge: {
    backgroundColor: palette.cream,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  slotTitle: {
    marginBottom: spacing.xs,
  },
  slotDesc: {
    marginBottom: spacing.md,
  },
  slotActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  historySection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  historyInfo: {
    flex: 1,
  },
});
