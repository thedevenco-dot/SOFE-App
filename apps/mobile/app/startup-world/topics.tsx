import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { Card, EmptyState, ErrorState, FollowButton, SkeletonCard } from '../../src/components';
import { startupWorldApi, ApiTopic } from '../../src/lib/startup-world-api';

const FALLBACK_TOPICS_CATALOG: ApiTopic[] = [
  {
    id: 'top-01',
    name: 'Venture Strategy',
    slug: 'venture-strategy',
    description: 'Capital structure, board dynamics, and venture fund unit economics.',
  },
  {
    id: 'top-02',
    name: 'Product & Growth',
    slug: 'product-growth',
    description: 'PMF measurement, retention curves, cohort analyses, and viral loops.',
  },
  {
    id: 'top-03',
    name: 'Fundraising',
    slug: 'fundraising',
    description: 'Term sheets, dilution modeling, angel syndicates, and investor pitch decks.',
  },
  {
    id: 'top-04',
    name: 'Go-To-Market',
    slug: 'go-to-market',
    description: 'Enterprise sales playbooks, outbound SDR motions, and CAC payback optimization.',
  },
  {
    id: 'top-05',
    name: 'Founder Psychology',
    slug: 'founder-psychology',
    description:
      'Decision fatigue, executive resilience, and navigating startup near-death experiences.',
  },
];

export default function ManageTopicsScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<ApiTopic[]>(FALLBACK_TOPICS_CATALOG);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(['top-01', 'top-02']));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [topicsRes, followedRes] = await Promise.allSettled([
        startupWorldApi.listTopics(false),
        startupWorldApi.getFollowedTopics(),
      ]);

      if (topicsRes.status === 'fulfilled' && topicsRes.value && topicsRes.value.length > 0) {
        setTopics(topicsRes.value);
      }

      if (followedRes.status === 'fulfilled' && followedRes.value) {
        setFollowedIds(new Set(followedRes.value));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load topics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTopics();
  };

  const toggleFollow = async (topicId: string) => {
    const isCurrentlyFollowing = followedIds.has(topicId);
    const nextSet = new Set(followedIds);
    if (isCurrentlyFollowing) {
      nextSet.delete(topicId);
      setFollowedIds(nextSet);
      try {
        await startupWorldApi.unfollowTopic(topicId);
      } catch {
        // rollback
        nextSet.add(topicId);
        setFollowedIds(nextSet);
      }
    } else {
      nextSet.add(topicId);
      setFollowedIds(nextSet);
      try {
        await startupWorldApi.followTopic(topicId);
      } catch {
        // rollback
        nextSet.delete(topicId);
        setFollowedIds(nextSet);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title3, styles.navTitle]}>Manage Topics</Text>
        <View style={styles.placeholderIcon} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Navy Header Intro Banner */}
        <View style={styles.heroBanner}>
          <Text style={[typography.eyebrow, styles.eyebrow]}>CURATED TRACKS</Text>
          <Text style={[typography.display, styles.bannerTitle]}>Follow Topics</Text>
          <Text style={[typography.body, styles.bannerSubtitle]}>
            Customise your Startup World feed by following the venture disciplines most relevant to
            your current stage.
          </Text>
        </View>

        <View style={styles.topicsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={loadTopics} />
          ) : topics.length === 0 ? (
            <EmptyState
              title="No topics available"
              description="Check back soon as new startup disciplines are added."
            />
          ) : (
            topics.map((t) => (
              <Card key={t.id} variant="white" style={styles.topicCard}>
                <View style={styles.topicCardRow}>
                  <TouchableOpacity
                    style={styles.topicInfo}
                    onPress={() => router.push(`/startup-world/topic/${t.slug}` as never)}
                  >
                    <Text style={[typography.title3, styles.topicName]}>{t.name}</Text>
                    {t.description && (
                      <Text style={[typography.caption, styles.topicDescription]} numberOfLines={2}>
                        {t.description}
                      </Text>
                    )}
                    <View style={styles.viewTopicLinkRow}>
                      <Text style={[typography.caption, styles.viewTopicText]}>
                        View dispatches
                      </Text>
                      <ChevronRight size={14} color={palette.orangeDeep} />
                    </View>
                  </TouchableOpacity>

                  <FollowButton
                    isFollowing={followedIds.has(t.id)}
                    onPress={() => toggleFollow(t.id)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  backButton: {
    padding: spacing.xs,
  },
  navTitle: {
    color: palette.navy,
  },
  placeholderIcon: {
    width: 24,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  heroBanner: {
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    color: palette.gold,
  },
  bannerTitle: {
    color: palette.white,
    marginTop: spacing.xs,
  },
  bannerSubtitle: {
    color: palette.cream,
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  topicsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  topicCard: {
    padding: spacing.md,
  },
  topicCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    color: palette.navy,
  },
  topicDescription: {
    color: palette.navy,
    opacity: 0.75,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  viewTopicLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 2,
  },
  viewTopicText: {
    color: palette.orangeDeep,
    fontWeight: '700',
  },
});
