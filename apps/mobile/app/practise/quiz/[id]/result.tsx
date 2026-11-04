import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, XCircle, Zap, ArrowRight, Award } from 'lucide-react-native';
import { colorRoles, palette, radius, spacing } from '@sofe/shared';
import { useTheme } from '../../../../src/theme/theme-context';
import { typography } from '../../../../src/theme/typography';
import { Card } from '../../../../src/components/Card';
import { Button } from '../../../../src/components/Button';
import { practiseApi, type PracticeHistoryItem } from '../../../../src/lib/practise-api';

export default function QuizResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [historyItem, setHistoryItem] = useState<PracticeHistoryItem | null>(null);

  const loadResult = useCallback(async () => {
    try {
      const history = await practiseApi.getPracticeHistory(10);
      const match = history.find((h) => h.quizId === id) || history[0];
      if (match) {
        setHistoryItem(match);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  const score = historyItem?.score ?? 100;
  const passed = historyItem ? historyItem.passed : score >= 80;
  const pointsAwarded = historyItem?.pointsAwarded ?? (passed ? 50 : 0);
  const quizTitle = historyItem?.quizTitle ?? 'Tactical Unit Economics Drill';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Top Score Hero Card */}
        <Card
          variant="white"
          padding={spacing.lg}
          style={[styles.scoreHero, passed ? styles.passedHero : styles.failedHero]}
        >
          <View style={styles.badgeRow}>
            {passed ? (
              <CheckCircle2 size={36} color={colorRoles.successOnLight} />
            ) : (
              <XCircle size={36} color={colorRoles.errorOnLight} />
            )}
          </View>

          <Text style={[typography.hero, styles.scoreText, { color: palette.navy }]}>{score}%</Text>

          <Text style={[typography.title2, styles.resultTitle, { color: palette.navy }]}>
            {passed ? 'Mastery Calibrated' : 'Calibration Incomplete'}
          </Text>

          <Text style={[typography.body, styles.resultSub, { color: palette.mutedOnLight }]}>
            {passed
              ? 'Excellent tactical decision-making. Your founder intuition is strengthening.'
              : 'Review key mental models below to sharpen your operational metrics.'}
          </Text>

          {/* Points Pill */}
          <View
            style={[
              styles.pointsPill,
              { backgroundColor: palette.white, borderColor: palette.line },
            ]}
          >
            <Zap size={16} color={palette.gold} fill={palette.gold} />
            <Text style={[typography.caption, styles.pointsText, { color: palette.navy }]}>
              {passed
                ? `+${pointsAwarded} pts credited to your ledger`
                : '0 pts · Drill requires 80% to pass'}
            </Text>
          </View>
        </Card>

        {/* Drill Context Card */}
        <View style={styles.reviewSection}>
          <Text style={[typography.title3, { color: colors.text, marginBottom: spacing.sm }]}>
            Drill Overview
          </Text>
          <Card variant="outlined" padding={spacing.md} style={styles.overviewCard}>
            <Text style={[typography.caption, { color: palette.orange, fontWeight: '700' }]}>
              EXECUTIVE RUNNER BREAKDOWN
            </Text>
            <Text style={[typography.title3, { color: palette.navy, marginVertical: spacing.xs }]}>
              {quizTitle}
            </Text>
            <Text style={[typography.body, { color: palette.mutedOnLight }]}>
              Passing threshold: 80% · 3 Rapid Scenarios
            </Text>
          </Card>
        </View>

        {/* Learning Takeaway Box */}
        <Card variant="tint" padding={spacing.md} style={styles.takeawayCard}>
          <View style={styles.takeawayTitleRow}>
            <Award size={18} color={palette.navy} />
            <Text style={[typography.title3, { color: palette.navy, marginLeft: spacing.xs }]}>
              Key Founder Model
            </Text>
          </View>
          <Text style={[typography.body, styles.takeawayBody, { color: palette.mutedOnLight }]}>
            Unit economics must be evaluated on a blended vs paid CAC basis. When payback period
            exceeds 12 months in seed stage, capital efficiency deteriorates faster than top-line
            growth can compensate.
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            variant="primary"
            size="lg"
            pill
            onPress={() => router.push('/(tabs)/practise' as never)}
            style={styles.mainActionButton}
          >
            <Text style={[typography.body, { color: palette.cream, fontWeight: '600' }]}>
              Return to Practise
            </Text>
            <ArrowRight size={16} color={palette.cream} style={{ marginLeft: spacing.xs }} />
          </Button>

          <Button
            variant="ghost"
            size="md"
            onPress={() => router.push('/practise/points' as never)}
            style={styles.pointsButton}
          >
            View Points Ledger
          </Button>
        </View>
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
  scoreHero: {
    alignItems: 'center',
    borderRadius: radius.card,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  passedHero: {
    backgroundColor: palette.cream,
    borderColor: colorRoles.successOnLight,
  },
  failedHero: {
    backgroundColor: palette.cream,
    borderColor: colorRoles.errorOnLight,
  },
  badgeRow: {
    marginBottom: spacing.xs,
  },
  scoreText: {
    marginVertical: spacing.xs,
  },
  resultTitle: {
    marginBottom: spacing.xs,
  },
  resultSub: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pointsText: {
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  reviewSection: {
    marginBottom: spacing.lg,
  },
  overviewCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
  },
  takeawayCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  takeawayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  takeawayBody: {
    lineHeight: 22,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsButton: {
    alignSelf: 'center',
  },
});
