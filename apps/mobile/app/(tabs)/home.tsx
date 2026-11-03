import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import { palette, radius, shadows, spacing, type HomeDashboardResponse } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import { AppHeader } from '../../src/components/AppHeader';
import { ScreenHero } from '../../src/components/ScreenHero';
import { ContentSheet } from '../../src/components/ContentSheet';
import { HeroImageCard } from '../../src/components/HeroImageCard';
import { CourseCardLarge } from '../../src/components/CourseCardLarge';
import { SectionHeader } from '../../src/components/SectionHeader';
import { ProgressRing } from '../../src/components/ProgressRing';
import { TaskRow } from '../../src/components/TaskRow';
import { TagChip } from '../../src/components/TagChip';
import { ErrorState } from '../../src/components/ErrorState';
import { Skeleton } from '../../src/components/Skeleton';
import { homeApi } from '../../src/lib/home-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VISION_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.42);

export default function HomeScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<HomeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const tz = Intl?.DateTimeFormat?.().resolvedOptions()?.timeZone || 'Asia/Kolkata';
      const data = await homeApi.getHomeDashboard(tz);
      setDashboard(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load home dashboard';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleToggleTask = async (taskId: string, currentDone: boolean) => {
    if (!dashboard) return;
    const newDone = !currentDone;

    // Optimistic UI update
    setDashboard((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.todayPlan.items.map((i) =>
        i.id === taskId
          ? { ...i, done: newDone, doneAt: newDone ? new Date().toISOString() : undefined }
          : i,
      );
      const updatedCount = updatedItems.filter((i) => i.done).length;
      return {
        ...prev,
        todayPlan: {
          ...prev.todayPlan,
          items: updatedItems,
          completedCount: updatedCount,
        },
      };
    });

    try {
      const tz = Intl?.DateTimeFormat?.().resolvedOptions()?.timeZone;
      const res = await homeApi.toggleDailyTask(taskId, newDone, tz);
      if (res?.completedCount !== undefined) {
        setDashboard((prev) =>
          prev
            ? {
                ...prev,
                todayPlan: {
                  ...prev.todayPlan,
                  completedCount: res.completedCount,
                },
              }
            : prev,
        );
      }
    } catch {
      // Revert on error
      fetchDashboard();
    }
  };

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skeletonContainer}>
          <Skeleton width="100%" height={120} style={{ marginBottom: spacing.md }} />
          <Skeleton width="60%" height={28} style={{ marginBottom: spacing.lg }} />
          <Skeleton
            width="100%"
            height={240}
            style={{ borderRadius: radius.xl, marginBottom: spacing.lg }}
          />
          <Skeleton
            width="100%"
            height={180}
            style={{ borderRadius: radius.xl, marginBottom: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={fetchDashboard} />
      </SafeAreaView>
    );
  }

  const {
    user,
    streak,
    greeting,
    word,
    quote,
    todayPlan,
    continueLearning,
    visionBoard,
    spotlightArticle,
  } = dashboard!;

  const planTotal = todayPlan?.items?.length || 0;
  const planCompleted = todayPlan?.completedCount || 0;
  const planPercent = planTotal > 0 ? (planCompleted / planTotal) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.orange}
            colors={[palette.orange]}
          />
        }
      >
        {/* Navy Header Section */}
        <AppHeader
          variant="home"
          greetingName={user?.name || 'Founder'}
          userAvatarUrl={user?.avatarUrl}
          onNotificationsPress={() => router.push('/notifications')}
          onAvatarPress={() => router.push('/profile')}
        />

        <ScreenHero
          eyebrow={user?.cohortLabel || 'COHORT IX · WEEK 4'}
          streakDays={streak?.currentStreakDays || 1}
          streakPoints={streak?.points || 150}
          title={greeting || `Good morning, ${user?.name || 'Founder'}.`}
          subtitle={`Focus: ${word?.word || 'MOMENTUM'} — ${word?.meaning || 'Daily disciplined forward progress.'}`}
        />

        {/* Cream Content Sheet */}
        <ContentSheet hasDragHandle style={styles.contentSheet}>
          {/* Curator's Manifesto Hero Card */}
          <HeroImageCard
            imageUri="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200"
            eyebrow="CURATOR'S MANIFESTO"
            title="Build something that matters."
            body={`Strategic Anchor: ${word?.word || 'MOMENTUM'}`}
            quote={{
              text: quote?.text || 'Ideas are easy. Implementation is hard.',
              author: quote?.author || 'Founder Operating Principle',
            }}
            onPress={() => router.push('/home/quote')}
            style={styles.sectionSpacer}
          />

          {/* Active Curriculum / Continue Learning Section */}
          <SectionHeader
            title="Active Curriculum"
            actionLabel="VIEW SYLLABUS →"
            onActionPress={() => router.push('/learn')}
            style={styles.sectionHeader}
          />

          {continueLearning ? (
            <CourseCardLarge
              imageUri={
                continueLearning.thumbnailUrl ||
                'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800'
              }
              tagLabel="MASTERCLASS"
              timeLabel={`${Math.round((continueLearning.durationSec || 900) / 60)} mins`}
              eyebrow={continueLearning.moduleTitle || 'MODULE 01 · PROBLEM-SOLUTION FIT'}
              title={continueLearning.lessonTitle}
              description={continueLearning.courseTitle}
              progressPercent={continueLearning.percent || 20}
              progressLabel={`Curriculum Progress ${continueLearning.percent || 20}%`}
              ctaLabel="Continue learning →"
              onCtaPress={() =>
                router.push({
                  pathname: '/learn/lesson/[lessonId]',
                  params: { lessonId: continueLearning.lessonId },
                })
              }
              style={styles.sectionSpacer}
            />
          ) : (
            <CourseCardLarge
              imageUri="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800"
              tagLabel="FLAGSHIP"
              timeLabel="8.5 hours"
              eyebrow="CORE DISCIPLINE"
              title="Foundations of High-Growth Venture Building"
              description="Learn repeatable methodologies for early customer discovery, unit economics, and scalable distribution."
              ctaLabel="Explore Masterclasses →"
              onCtaPress={() => router.push('/learn')}
              style={styles.sectionSpacer}
            />
          )}

          {/* Today's Protocol Section */}
          <SectionHeader
            title="Your Daily Protocol"
            subtitle="Daily discipline scales ventures"
            actionLabel="VIEW ALL →"
            onActionPress={() => router.push('/home/plan')}
            rightElement={
              <ProgressRing
                size={40}
                strokeWidth={4}
                progress={planPercent}
                label={`${planCompleted}/${planTotal}`}
              />
            }
            style={styles.sectionHeader}
          />

          <View style={styles.protocolList}>
            {todayPlan?.items?.slice(0, 3).map((item) => (
              <TaskRow
                key={item.id}
                title={item.label}
                subtitle={item.key === 'watch_lesson' ? 'Video masterclass lesson' : undefined}
                minutes={item.key === 'watch_lesson' ? 18 : 10}
                points={25}
                isCompleted={item.done}
                onToggle={() => handleToggleTask(item.id, item.done)}
              />
            ))}
          </View>

          {/* Vision Board Preview Section */}
          <SectionHeader
            title="Vision Board"
            actionLabel={`VIEW ALL (${visionBoard?.length || 0}) →`}
            onActionPress={() => router.push('/home/vision')}
            style={styles.sectionHeader}
          />

          {visionBoard && visionBoard.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.visionCarousel}
            >
              {visionBoard.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={styles.visionThumbCard}
                  onPress={() => router.push('/home/vision')}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.visionImage}
                    resizeMode="cover"
                  />
                  <View style={styles.visionCaptionOverlay}>
                    <Text style={[typography.caption, styles.visionCaptionText]} numberOfLines={2}>
                      {item.caption || 'Milestone Target'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.emptyVisionCard}
              onPress={() => router.push('/home/vision-edit')}
            >
              <Sparkles size={24} color={palette.orange} />
              <View style={styles.emptyVisionText}>
                <Text style={[typography.bodyStrong, { color: palette.navy }]}>
                  Curate Your Vision Board
                </Text>
                <Text style={[typography.caption, { color: palette.slate }]}>
                  Add up to 12 milestone targets to anchor your daily focus.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Founder Spotlight Article Section */}
          {spotlightArticle && (
            <View style={styles.spotlightSection}>
              <SectionHeader
                title="Founder Spotlight"
                actionLabel="READ ESSAY ↗"
                onActionPress={() =>
                  router.push({
                    pathname: '/startup-world/article/[slug]',
                    params: { slug: spotlightArticle.slug },
                  })
                }
                style={styles.sectionHeader}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.spotlightCard}
                onPress={() =>
                  router.push({
                    pathname: '/startup-world/article/[slug]',
                    params: { slug: spotlightArticle.slug },
                  })
                }
              >
                <Image
                  source={{ uri: spotlightArticle.coverUrl }}
                  style={styles.spotlightImage}
                  resizeMode="cover"
                />
                <View style={styles.spotlightContent}>
                  <View style={styles.spotlightMeta}>
                    <TagChip label="WEEKLY DEEP DIVE" variant="orange" />
                    <Text style={[typography.caption, styles.spotlightReadTime]}>
                      {spotlightArticle.readTimeMin} min read
                    </Text>
                  </View>
                  <Text style={[typography.title2, styles.spotlightTitle]}>
                    {spotlightArticle.title}
                  </Text>
                  <Text style={[typography.body, styles.spotlightExcerpt]} numberOfLines={2}>
                    {spotlightArticle.excerpt}
                  </Text>
                  <View style={styles.spotlightActionRow}>
                    <Text style={[typography.bodyStrong, styles.spotlightActionText]}>
                      Read essay
                    </Text>
                    <ArrowUpRight size={16} color={palette.orangeDeep} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ContentSheet>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.navy,
  },
  scroll: {
    flex: 1,
    backgroundColor: palette.navy,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl * 2,
  },
  skeletonContainer: {
    padding: spacing.lg,
  },
  contentSheet: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionSpacer: {
    marginBottom: spacing.sm,
  },
  protocolList: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  visionCarousel: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  visionThumbCard: {
    width: VISION_CARD_WIDTH,
    height: Math.round(VISION_CARD_WIDTH * 1.2),
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.peachTint,
    borderWidth: 1,
    borderColor: palette.line,
    ...shadows.soft,
  },
  visionImage: {
    width: '100%',
    height: '100%',
  },
  visionCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 15, 30, 0.72)',
    padding: spacing.xs,
  },
  visionCaptionText: {
    color: palette.cream,
    fontWeight: '500',
  },
  emptyVisionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft,
  },
  emptyVisionText: {
    flex: 1,
  },
  spotlightSection: {
    marginTop: spacing.md,
  },
  spotlightCard: {
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderColor: palette.line,
    borderWidth: 1,
    ...shadows.hover,
  },
  spotlightImage: {
    width: '100%',
    height: 180,
  },
  spotlightContent: {
    padding: spacing.lg,
  },
  spotlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  spotlightReadTime: {
    color: palette.slate,
  },
  spotlightTitle: {
    color: palette.navy,
    marginVertical: spacing.xs,
  },
  spotlightExcerpt: {
    color: palette.slate,
    marginBottom: spacing.md,
  },
  spotlightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotlightActionText: {
    color: palette.orangeDeep,
  },
});
