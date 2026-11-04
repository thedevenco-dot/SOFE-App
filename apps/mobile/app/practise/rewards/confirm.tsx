import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gift, Zap, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { colorRoles, palette, radius, spacing } from '@sofe/shared';
import { useTheme } from '../../../src/theme/theme-context';
import { typography } from '../../../src/theme/typography';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { practiseApi } from '../../../src/lib/practise-api';

export default function RewardConfirmScreen() {
  const router = useRouter();
  const { id, title, pointsCost, currentBalance } = useLocalSearchParams<{
    id: string;
    title: string;
    pointsCost: string;
    currentBalance: string;
  }>();
  const { colors } = useTheme();

  const [submitting, setSubmitting] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const cost = parseInt(pointsCost || '500', 10);
  const balance = parseInt(currentBalance || '0', 10);
  const remaining = Math.max(0, balance - cost);
  const hasEnoughPoints = balance >= cost;

  const handleConfirm = async () => {
    if (!id) return;

    setSubmitting(true);
    try {
      const res = await practiseApi.redeemReward(id);
      setRemainingBalance(res.remainingBalance);
      setRedeemed(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Redemption failed. Please try again.';
      Alert.alert('Redemption Issue', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (redeemed) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <CheckCircle2 size={44} color={colorRoles.successOnLight} />
          </View>

          <Text style={[typography.title1, styles.successTitle, { color: palette.navy }]}>
            Perk Unlocked!
          </Text>

          <Text style={[typography.body, styles.successSub, { color: palette.mutedOnLight }]}>
            You have successfully redeemed {title || 'your founder perk'}.
          </Text>

          <Card variant="outlined" padding={spacing.md} style={styles.remainingCard}>
            <View style={styles.remainingRow}>
              <Text style={[typography.caption, { color: palette.mutedOnLight }]}>
                REMAINING BALANCE
              </Text>
              <View style={styles.remainingBadge}>
                <Zap size={14} color={palette.gold} fill={palette.gold} />
                <Text
                  style={[
                    typography.caption,
                    { color: palette.navy, fontWeight: '700', marginLeft: spacing.xs },
                  ]}
                >
                  {remainingBalance} pts
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.actionColumn}>
            <Button
              variant="primary"
              size="lg"
              pill
              onPress={() => router.replace('/(tabs)/learn' as never)}
              style={styles.fullWidthButton}
            >
              <Text style={[typography.body, { color: palette.cream, fontWeight: '600' }]}>
                View in My Courses
              </Text>
              <ArrowRight size={16} color={palette.cream} style={{ marginLeft: spacing.xs }} />
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => router.replace('/(tabs)/practise' as never)}
              style={{ marginTop: spacing.xs }}
            >
              Return to Practise
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Icon */}
        <View style={styles.iconCircle}>
          <Gift size={32} color={palette.orange} />
        </View>

        <Text style={[typography.title2, styles.headerTitle, { color: palette.navy }]}>
          Confirm Reward Redemption
        </Text>
        <Text style={[typography.body, styles.headerSub, { color: palette.mutedOnLight }]}>
          Review your points breakdown before confirming. Redemptions are immediate and
          irreversible.
        </Text>

        {/* Selected Perk Card */}
        <Card variant="outlined" padding={spacing.md} style={styles.summaryCard}>
          <Text style={[typography.caption, { color: palette.orange, fontWeight: '700' }]}>
            SELECTED REWARD
          </Text>
          <Text style={[typography.title3, styles.rewardTitle, { color: palette.navy }]}>
            {title || 'Founders Unit Economics Masterclass'}
          </Text>

          {/* Breakdown Table */}
          <View style={[styles.breakdownTable, { borderColor: palette.line }]}>
            <View style={styles.breakdownRow}>
              <Text style={[typography.body, { color: palette.mutedOnLight }]}>
                Current Points Balance
              </Text>
              <Text style={[typography.body, { color: palette.navy, fontWeight: '600' }]}>
                {balance} pts
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[typography.body, { color: palette.mutedOnLight }]}>Cost of Reward</Text>
              <Text
                style={[typography.body, { color: colorRoles.errorOnLight, fontWeight: '600' }]}
              >
                -{cost} pts
              </Text>
            </View>

            <View style={[styles.breakdownDivider, { backgroundColor: palette.line }]} />

            <View style={styles.breakdownRow}>
              <Text style={[typography.body, { color: palette.navy, fontWeight: '700' }]}>
                Remaining Points
              </Text>
              <Text style={[typography.title3, { color: colorRoles.successOnLight }]}>
                {remaining} pts
              </Text>
            </View>
          </View>
        </Card>

        {/* Guarantee Info */}
        <View style={styles.guaranteeRow}>
          <ShieldCheck size={18} color={colorRoles.successOnLight} />
          <Text style={[typography.caption, styles.guaranteeText, { color: palette.mutedOnLight }]}>
            Instant digital fulfillment. Access is bound to your founder ID.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            variant="primary"
            size="lg"
            pill
            disabled={!hasEnoughPoints || submitting}
            loading={submitting}
            onPress={handleConfirm}
            style={styles.fullWidthButton}
          >
            {hasEnoughPoints ? `Confirm & Redeem (${cost} pts)` : 'Insufficient Points'}
          </Button>

          <Button
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: spacing.xs }}
          >
            Cancel
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSub: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  summaryCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  rewardTitle: {
    marginVertical: spacing.xs,
  },
  breakdownTable: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  breakdownDivider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  guaranteeText: {
    marginLeft: spacing.xs,
    flex: 1,
  },
  buttonGroup: {
    gap: spacing.xs,
  },
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    marginBottom: spacing.xs,
  },
  successSub: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  remainingCard: {
    width: '100%',
    backgroundColor: palette.cream,
    borderColor: palette.line,
    borderRadius: radius.card,
    marginBottom: spacing.xl,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionColumn: {
    width: '100%',
    gap: spacing.xs,
  },
});
