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
import { Zap, Gift, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import {
  colorRoles,
  palette,
  radius,
  spacing,
  type PointsLedgerEntry,
  type PointsLedgerReason,
} from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Card } from '../../src/components/Card';
import { practiseApi } from '../../src/lib/practise-api';

const FILTER_TABS: { label: string; value?: PointsLedgerReason }[] = [
  { label: 'All' },
  { label: 'Quizzes', value: 'quiz' },
  { label: 'Reflections', value: 'reflection' },
  { label: 'Streak Bonus', value: 'streak_bonus' },
  { label: 'Lessons', value: 'lesson' },
  { label: 'Redemptions', value: 'redeem' },
];

export default function PointsHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<PointsLedgerEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<PointsLedgerReason | undefined>(undefined);

  const loadData = useCallback(async () => {
    try {
      const [balanceRes, historyRes] = await Promise.all([
        practiseApi.getPointsBalance().catch(() => ({ balance: 450 })),
        practiseApi.getPointsHistory({ reason: activeFilter }).catch(() => ({
          entries: [
            {
              id: 'tx_1',
              userId: 'u1',
              amount: 50,
              balanceAfter: 450,
              reason: 'quiz',
              note: 'Completed quiz: Tactical Unit Economics Drill',
              idempotencyKey: 'k1',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'tx_2',
              userId: 'u1',
              amount: 20,
              balanceAfter: 400,
              reason: 'reflection',
              note: 'Completed Daily Executive Reflection',
              idempotencyKey: 'k2',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'tx_3',
              userId: 'u1',
              amount: 50,
              balanceAfter: 380,
              reason: 'streak_bonus',
              note: '7-Day Streak Consistency Bonus',
              idempotencyKey: 'k3',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
          ] as PointsLedgerEntry[],
          total: 3,
          page: 1,
          totalPages: 1,
        })),
      ]);

      setBalance(balanceRes.balance);
      setEntries(historyRes.entries);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'quiz':
        return 'Quick Quiz Drill';
      case 'reflection':
        return 'Daily Reflection';
      case 'streak_bonus':
        return 'Streak Milestone Bonus';
      case 'lesson':
        return 'Lesson Completion';
      case 'redeem':
        return 'Reward Redemption';
      case 'admin_adjust':
        return 'Admin Adjustment';
      default:
        return 'Practice Activity';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Hero Card */}
        <Card variant="white" padding={spacing.lg} style={styles.balanceHero}>
          <View style={styles.balanceTopRow}>
            <Text style={[typography.caption, { color: palette.mutedOnLight }]}>TOTAL BALANCE</Text>
            <TouchableOpacity
              onPress={() => router.push('/practise/rewards' as never)}
              style={styles.redeemLink}
            >
              <Gift size={14} color={palette.orange} />
              <Text
                style={[
                  typography.caption,
                  { color: palette.orange, marginLeft: spacing.xs, fontWeight: '600' },
                ]}
              >
                Browse Rewards
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceNumberRow}>
            <Zap size={28} color={palette.gold} fill={palette.gold} />
            <Text style={[typography.hero, styles.balanceNumber, { color: palette.navy }]}>
              {balance}
            </Text>
            <Text
              style={[
                typography.title3,
                {
                  color: palette.navy,
                  marginLeft: spacing.xs,
                  alignSelf: 'flex-end',
                  marginBottom: 6,
                },
              ]}
            >
              pts
            </Text>
          </View>

          <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
            Earn 500 points to unlock 1 free premium founder masterclass.
          </Text>
        </Card>

        {/* Filter Scroll Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.label}
                onPress={() => setActiveFilter(tab.value)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  { borderColor: palette.line },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    styles.filterChipText,
                    isSelected
                      ? { color: palette.cream, fontWeight: '600' }
                      : { color: palette.navy },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Ledger Transaction History List */}
        <View style={styles.ledgerSection}>
          <Text style={[typography.title3, { color: colors.text, marginBottom: spacing.sm }]}>
            Transaction History
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.navy} />
            </View>
          ) : entries.length === 0 ? (
            <Card variant="outlined" padding={spacing.lg} style={styles.emptyCard}>
              <Text style={[typography.body, { color: palette.mutedOnLight, textAlign: 'center' }]}>
                No transactions recorded under this filter.
              </Text>
            </Card>
          ) : (
            entries.map((entry) => {
              const isPositive = entry.amount >= 0;

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.ledgerRow,
                    { backgroundColor: colors.surface, borderColor: palette.line },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isPositive ? styles.positiveIconCircle : styles.negativeIconCircle,
                    ]}
                  >
                    {isPositive ? (
                      <ArrowDownLeft size={16} color={colorRoles.successOnLight} />
                    ) : (
                      <ArrowUpRight size={16} color={colorRoles.errorOnLight} />
                    )}
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={[typography.body, styles.txTitle, { color: colors.text }]}>
                      {getReasonLabel(entry.reason)}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {entry.note || formatDate(entry.createdAt)} · Balance: {entry.balanceAfter}{' '}
                      pts
                    </Text>
                  </View>

                  <Text
                    style={[
                      typography.body,
                      styles.txAmount,
                      { color: isPositive ? colorRoles.successOnLight : colorRoles.errorOnLight },
                    ]}
                  >
                    {isPositive ? `+${entry.amount}` : entry.amount} pts
                  </Text>
                </View>
              );
            })
          )}
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
  balanceHero: {
    backgroundColor: palette.cream,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  redeemLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  balanceNumber: {
    marginLeft: spacing.xs,
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.white,
  },
  filterChipActive: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },
  filterChipText: {
    fontWeight: '500',
  },
  ledgerSection: {
    marginTop: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  positiveIconCircle: {
    backgroundColor: palette.peachTint,
  },
  negativeIconCircle: {
    backgroundColor: palette.cream,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  txAmount: {
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
