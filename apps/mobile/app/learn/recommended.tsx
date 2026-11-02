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
import { ArrowLeft, Search, Sparkles } from 'lucide-react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  Card,
  CourseCardLarge,
  CourseCardRow,
  EmptyState,
  ErrorState,
  SectionHeader,
  SkeletonCard,
} from '../../src/components';
import { learnApi, ApiCourse } from '../../src/lib/learn-api';

const MOCK_RECOMMENDED: ApiCourse[] = [
  {
    id: 'c-rec-1',
    slug: 'foundations-of-high-growth-venture-building',
    title: 'Foundations of High-Growth Venture Building',
    subtitle: 'From zero to repeatable PMF, unit economics, and an enduring core leadership team.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    level: 'intermediate',
    priceInr: 1499900,
    stats: {
      enrolledCount: 1420,
      ratingAvg: 4.95,
      ratingCount: 312,
      lessonCount: 36,
      durationSec: 64800,
    },
    instructors: [
      {
        id: 'inst-1',
        name: 'Naveen Jain',
        title: 'Managing Director, SOFE Ventures',
      },
    ],
  },
  {
    id: 'c-rec-2',
    slug: 'saas-pricing-and-packaging-mastery',
    title: 'SaaS Pricing & Packaging Architecture',
    subtitle:
      'Value metrics, multi-tier seat structures, and expansion levers for Series A startups.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    level: 'advanced',
    priceInr: 999900,
    stats: {
      enrolledCount: 890,
      ratingAvg: 4.88,
      ratingCount: 164,
      lessonCount: 24,
      durationSec: 43200,
    },
    instructors: [
      {
        id: 'inst-2',
        name: 'Elena Rostova',
        title: 'VP Monetization, ScaleX',
      },
    ],
  },
  {
    id: 'c-rec-3',
    slug: 'venture-fundraising-mechanics',
    title: 'Venture Fundraising Mechanics & Data Rooms',
    subtitle: 'Master SAFE notes, cap tables, partner meetings, and investor due diligence.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    level: 'intermediate',
    priceInr: 1299900,
    stats: {
      enrolledCount: 2150,
      ratingAvg: 4.92,
      ratingCount: 420,
      lessonCount: 28,
      durationSec: 50400,
    },
    instructors: [
      {
        id: 'inst-3',
        name: 'Arjun Mehta',
        title: 'General Partner, Beacon Seed',
      },
    ],
  },
];

export default function RecommendedCoursesScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState<ApiCourse[]>(MOCK_RECOMMENDED);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommended = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await learnApi.getRecommendedCourses();
      if (res && res.length > 0) {
        setCourses(res);
      } else {
        setCourses(MOCK_RECOMMENDED);
      }
    } catch {
      setError('Unable to load personalized recommendations. Showing top cohort picks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecommended();
  }, [loadRecommended]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecommended();
  };

  const topPick = courses[0];
  const restPicks = courses.slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.navTitle]}>Recommended for You</Text>
        <TouchableOpacity
          onPress={() => router.push('/learn/search' as never)}
          style={styles.navButton}
          accessibilityLabel="Search"
        >
          <Search size={20} color={palette.navy} />
        </TouchableOpacity>
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
        {/* Recommendation Context Banner */}
        <Card style={styles.cohortBanner}>
          <View style={styles.bannerIcon}>
            <Sparkles size={20} color={palette.orange} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={[typography.label, styles.bannerTitle]}>Tailored to Your Stage</Text>
            <Text style={[typography.bodySmall, styles.bannerSubtitle]}>
              Curated based on your venture focus, team size, and historical masterclass engagement.
            </Text>
          </View>
        </Card>

        {/* Error Notification */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadRecommended} />
          </View>
        ) : null}

        {/* Content list */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No Recommendations Yet"
            description="Explore courses and complete lessons to calibrate your personalized curriculum."
            actionLabel="Browse Catalogue"
            onAction={() => router.push('/learn/courses' as never)}
          />
        ) : (
          <View style={styles.coursesSection}>
            {topPick ? (
              <View style={styles.featuredWrap}>
                <CourseCardLarge
                  eyebrow="PRIMARY RECOMMENDATION"
                  title={topPick.title}
                  description={topPick.subtitle}
                  imageUri={topPick.thumbnailUrl}
                  tagLabel="HIGH CONVICTION"
                  timeLabel={`${Math.round((topPick.stats?.durationSec || 3600) / 3600)}h runtime`}
                  metaChips={[
                    topPick.level.toUpperCase(),
                    `${topPick.stats?.lessonCount || 24} LESSONS`,
                    topPick.priceInr === 0 ? 'FREE' : `₹${topPick.priceInr / 100}`,
                  ]}
                  instructorName={topPick.instructors?.[0]?.name || 'SOFE Fellows'}
                  rating={topPick.stats?.ratingAvg || 4.9}
                  ratingCount={topPick.stats?.ratingCount || 100}
                  ctaLabel="View Masterclass →"
                  onCtaPress={() => router.push(`/learn/course/${topPick.slug}` as never)}
                />
              </View>
            ) : null}

            {restPicks.length > 0 ? (
              <View style={styles.restSection}>
                <SectionHeader title="Up Next in Your Path" hasOrangeBar />
                {restPicks.map((c) => (
                  <CourseCardRow
                    key={c.id}
                    title={c.title}
                    thumbnailUrl={c.thumbnailUrl}
                    label={c.level.toUpperCase()}
                    metaText={`${Math.round((c.stats?.durationSec || 3600) / 3600)}h · ${c.stats?.lessonCount || 16} lessons`}
                    onPress={() => router.push(`/learn/course/${c.slug}` as never)}
                    style={styles.cardRow}
                  />
                ))}
              </View>
            ) : null}
          </View>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  navButton: {
    padding: spacing.xs,
  },
  navTitle: {
    color: palette.navy,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  cohortBanner: {
    flexDirection: 'row',
    backgroundColor: palette.peachTint,
    borderColor: palette.orange,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  bannerTitle: {
    color: palette.navy,
  },
  bannerSubtitle: {
    color: palette.navy,
    lineHeight: 18,
  },
  errorContainer: {
    marginBottom: spacing.xs,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  coursesSection: {
    gap: spacing.xl,
  },
  featuredWrap: {
    width: '100%',
  },
  restSection: {
    gap: spacing.sm,
  },
  cardRow: {
    marginBottom: spacing.xs,
  },
});
