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
import { Zap, CheckCircle2, Sparkles, Award, Brain, Layers, Swords } from 'lucide-react-native';
import { colorRoles, palette, radius, spacing, type PracticeTodayResponse } from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { practiseApi } from '../../src/lib/practise-api';

export default function DailyPracticePage() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PracticeTodayResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await practiseApi.getTodayPractice();
      setData(res);
    } catch {
      // Graceful fallback
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

  const schedule = data?.schedule;
  const slots = schedule?.slots || [];
  const completedCount = schedule?.completedCount ?? 0;
  const totalCount = slots.length || 5;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const getSlotIcon = (slotKey: string) => {
    switch (slotKey) {
      case 'quick_quiz':
        return <Zap size={18} color={palette.orange} fill={palette.orange} />;
      case 'brain_game':
        return <Brain size={18} color={palette.gold} />;
      case 'scenario_challenge':
        return <Swords size={18} color={palette.navy} />;
      case 'match_concept':
        return <Layers size={18} color={colorRoles.successOnLight} />;
      case 'daily_reflection':
        return <Sparkles size={18} color={palette.gold} />;
      default:
        return <Award size={18} color={palette.navy} />;
    }
  };

  const getPointsText = (slotKey: string) => {
    if (slotKey === 'quick_quiz') return '+50 pts';
    if (slotKey === 'daily_reflection') return '+20 pts';
    return '+30 pts';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Summary */}
        <View style={styles.header}>
          <Text style={[typography.title1, { color: colors.text }]}>Today&apos;s Workout</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Complete your 5 daily micro-drills to strengthen mental models and maintain your streak.
          </Text>

          {/* Progress Bar Card */}
          <Card variant="tint" padding={spacing.md} style={styles.progressCard}>
            <ProgressBar
              progress={progressPercent}
              leftLabel="Daily Workout Progress"
              rightLabel={`${completedCount}/${totalCount} completed`}
            />
          </Card>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.navy} />
          </View>
        ) : (
          <View style={styles.slotsList}>
            {slots.map((slot, index) => {
              const isAvailable =
                slot.slotKey === 'quick_quiz' || slot.slotKey === 'daily_reflection';
              const points = getPointsText(slot.slotKey);

              return (
                <Card
                  key={slot.slotKey}
                  variant="outlined"
                  padding={spacing.md}
                  style={[styles.slotCard, !isAvailable && styles.v15Card]}
                >
                  <View style={styles.slotRow}>
                    <View style={styles.iconCol}>{getSlotIcon(slot.slotKey)}</View>

                    <View style={styles.contentCol}>
                      <View style={styles.slotTitleRow}>
                        <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                          DRILL 0{index + 1} · {points}
                        </Text>
                        {slot.done ? (
                          <View style={styles.doneChip}>
                            <CheckCircle2 size={12} color={colorRoles.successOnLight} />
                            <Text
                              style={[
                                typography.caption,
                                { color: colorRoles.successOnLight, marginLeft: spacing.xs },
                              ]}
                            >
                              Done {slot.score !== undefined ? `(${slot.score}%)` : ''}
                            </Text>
                          </View>
                        ) : !isAvailable ? (
                          <View style={styles.v15Chip}>
                            <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                              v1.5
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={[typography.title3, styles.slotTitle, { color: palette.navy }]}>
                        {slot.title}
                      </Text>

                      <View style={styles.actionRow}>
                        {isAvailable ? (
                          <Button
                            variant={slot.done ? 'secondary' : 'primary'}
                            size="sm"
                            pill
                            onPress={() => {
                              if (slot.slotKey === 'quick_quiz') {
                                const quizId = slot.refId || data?.quickQuiz?.id || 'default';
                                if (slot.done) {
                                  router.push(`/practise/quiz/${quizId}/result` as never);
                                } else {
                                  router.push(`/practise/quiz/${quizId}` as never);
                                }
                              } else if (slot.slotKey === 'daily_reflection') {
                                router.push('/practise/reflection' as never);
                              }
                            }}
                          >
                            {slot.done ? 'Review' : 'Start'}
                          </Button>
                        ) : (
                          <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                            Available in Phase 7
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
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
  header: {
    marginBottom: spacing.lg,
  },
  progressCard: {
    backgroundColor: palette.cream,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginTop: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsList: {
    gap: spacing.md,
  },
  slotCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
  },
  v15Card: {
    opacity: 0.7,
  },
  slotRow: {
    flexDirection: 'row',
  },
  iconCol: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contentCol: {
    flex: 1,
  },
  slotTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  slotTitle: {
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.peachTint,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  v15Chip: {
    backgroundColor: palette.cream,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
