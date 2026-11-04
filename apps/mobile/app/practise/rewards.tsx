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
import { Zap, BookOpen, Tag, Award, ChevronRight } from 'lucide-react-native';
import { palette, radius, spacing, type RewardDto } from '@sofe/shared';
import { useTheme } from '../../src/theme/theme-context';
import { typography } from '../../src/theme/typography';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { practiseApi } from '../../src/lib/practise-api';

export default function RewardsStoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<RewardDto[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [balanceRes, rewardsRes] = await Promise.all([
        practiseApi.getPointsBalance().catch(() => ({ balance: 450 })),
        practiseApi.getRewards().catch(
          () =>
            [
              {
                id: 'r_1',
                title: 'Founders Unit Economics Masterclass',
                description: 'Full course access unlock including financial modeling templates.',
                type: 'course_access',
                costPoints: 500,
                stock: -1,
                status: 'active',
              },
              {
                id: 'r_2',
                title: '50% Off Annual SOFE Pro Pass',
                description: 'Exclusive 50% discount voucher for pro analytics and coaching.',
                type: 'discount_coupon',
                costPoints: 350,
                stock: 25,
                status: 'active',
              },
              {
                id: 'r_3',
                title: 'Verified Founder Calibrated Badge',
                description:
                  'Digital certification badge displayed on your public network profile.',
                type: 'badge',
                costPoints: 200,
                stock: -1,
                status: 'active',
              },
            ] as RewardDto[],
        ),
      ]);

      setBalance(balanceRes.balance);
      setRewards(rewardsRes);
    } catch {
      // Fallback
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

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'course_access':
        return <BookOpen size={20} color={palette.navy} />;
      case 'discount_coupon':
        return <Tag size={20} color={palette.orange} />;
      default:
        return <Award size={20} color={palette.gold} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course_access':
        return 'FREE COURSE UNLOCK';
      case 'discount_coupon':
        return 'DISCOUNT VOUCHER';
      default:
        return 'FOUNDER PERK';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Balance Banner */}
        <Card variant="tint" padding={spacing.md} style={styles.balanceBanner}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                AVAILABLE TO REDEEM
              </Text>
              <View style={styles.balanceTextRow}>
                <Zap size={20} color={palette.gold} fill={palette.gold} />
                <Text style={[typography.title1, { color: palette.navy, marginLeft: spacing.xs }]}>
                  {balance} pts
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/practise/points' as never)}
              style={styles.pointsLink}
            >
              <Text style={[typography.caption, { color: palette.navy, fontWeight: '600' }]}>
                Points History
              </Text>
              <ChevronRight size={14} color={palette.navy} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Catalogue Section */}
        <View style={styles.catalogueHeader}>
          <Text style={[typography.title2, { color: colors.text }]}>Founder Rewards</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Turn deliberate daily practice into tangible founder leverage.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.navy} />
          </View>
        ) : (
          <View style={styles.rewardsList}>
            {rewards.map((reward) => {
              const cost = reward.costPoints;
              const canAfford = balance >= cost;
              const pointsGap = cost - balance;

              return (
                <Card
                  key={reward.id}
                  variant="outlined"
                  padding={spacing.md}
                  style={styles.rewardCard}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.typeEyebrow}>
                      {getRewardIcon(reward.type)}
                      <Text style={[typography.caption, styles.typeLabel, { color: palette.navy }]}>
                        {getTypeLabel(reward.type)}
                      </Text>
                    </View>

                    <View style={[styles.costPill, { backgroundColor: palette.cream }]}>
                      <Zap size={12} color={palette.gold} fill={palette.gold} />
                      <Text style={[typography.caption, styles.costText, { color: palette.navy }]}>
                        {cost} pts
                      </Text>
                    </View>
                  </View>

                  <Text style={[typography.title3, styles.rewardTitle, { color: palette.navy }]}>
                    {reward.title}
                  </Text>
                  <Text
                    style={[typography.body, styles.rewardDesc, { color: palette.mutedOnLight }]}
                  >
                    {reward.description}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                      {reward.stock === -1 || reward.stock === null || reward.stock === undefined
                        ? 'Unlimited Access'
                        : `${reward.stock} available in stock`}
                    </Text>

                    <Button
                      variant={canAfford ? 'primary' : 'secondary'}
                      size="sm"
                      pill
                      onPress={() => {
                        router.push({
                          pathname: '/practise/rewards/confirm',
                          params: {
                            id: reward.id,
                            title: reward.title,
                            pointsCost: cost,
                            currentBalance: balance,
                          },
                        } as never);
                      }}
                    >
                      {canAfford ? 'Redeem Perk' : `Need ${pointsGap} more pts`}
                    </Button>
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
    paddingBottom: spacing.xxl,
  },
  balanceBanner: {
    backgroundColor: palette.cream,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pointsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catalogueHeader: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  rewardsList: {
    gap: spacing.md,
  },
  rewardCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  costText: {
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  rewardTitle: {
    marginBottom: spacing.xs,
  },
  rewardDesc: {
    marginBottom: spacing.md,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
});
