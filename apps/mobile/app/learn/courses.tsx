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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react-native';
import { palette, spacing } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  CourseCardLarge,
  CourseCardRow,
  EmptyState,
  ErrorState,
  FilterChip,
  SkeletonCard,
} from '../../src/components';
import { learnApi, ApiCategory, ApiCourse } from '../../src/lib/learn-api';

const MOCK_CATEGORIES: ApiCategory[] = [
  { id: 'all', name: 'All Courses', slug: 'all' },
  { id: 'startups', name: 'Startups & Ideation', slug: 'startups-ideation' },
  { id: 'strategy', name: 'Venture Strategy', slug: 'venture-strategy' },
  { id: 'saas', name: 'B2B SaaS Growth', slug: 'b2b-saas' },
  { id: 'gtm', name: 'Go-To-Market', slug: 'go-to-market' },
  { id: 'fundraising', name: 'Fundraising & Term Sheets', slug: 'fundraising' },
];

const MOCK_COURSES: ApiCourse[] = [
  {
    id: 'c-1',
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
    id: 'c-2',
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
    id: 'c-3',
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
  {
    id: 'c-4',
    slug: 'enterprise-outbound-engine',
    title: 'Enterprise Outbound & Pipeline Engineering',
    subtitle: 'Cold outreach sequences, account targeting, discovery calls, and closing deals.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    level: 'beginner',
    priceInr: 0,
    stats: {
      enrolledCount: 3100,
      ratingAvg: 4.85,
      ratingCount: 512,
      lessonCount: 18,
      durationSec: 32400,
    },
    instructors: [
      {
        id: 'inst-4',
        name: 'Rachel Vance',
        title: 'Founding CRO, Hypergrowth',
      },
    ],
  },
];

export default function AllCoursesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    level?: string;
    price?: 'free' | 'paid';
  }>();

  const [categories, setCategories] = useState<ApiCategory[]>(MOCK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
  const [courses, setCourses] = useState<ApiCourse[]>(MOCK_COURSES);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [catsRes, coursesRes] = await Promise.allSettled([
        learnApi.getCategories(),
        learnApi.listCourses({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          level: params.level,
          price: params.price,
        }),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value?.length > 0) {
        setCategories([{ id: 'all', name: 'All Courses', slug: 'all' }, ...catsRes.value]);
      }

      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data?.length > 0) {
        setCourses(coursesRes.value.data);
      } else {
        // Filter mock courses locally if API has no results
        const filtered = MOCK_COURSES.filter((c) => {
          if (params.level && c.level !== params.level) return false;
          if (params.price === 'free' && c.priceInr > 0) return false;
          if (params.price === 'paid' && c.priceInr === 0) return false;
          return true;
        });
        setCourses(filtered.length > 0 ? filtered : MOCK_COURSES);
      }
    } catch {
      setError('Unable to load masterclasses. Showing offline courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, params.level, params.price]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const featuredCourse = courses[0];
  const remainingCourses = courses.slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIconButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.navTitle]}>All Masterclasses</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => router.push('/learn/search' as never)}
            style={styles.navIconButton}
            accessibilityLabel="Search"
          >
            <Search size={20} color={palette.navy} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/learn/filters' as never)}
            style={styles.navIconButton}
            accessibilityLabel="Filter"
          >
            <SlidersHorizontal size={20} color={palette.navy} />
          </TouchableOpacity>
        </View>
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
        {/* Category Horizontal Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.name}
              selected={selectedCategory === cat.slug}
              onPress={() => setSelectedCategory(cat.slug)}
            />
          ))}
        </ScrollView>

        {/* Count & Status row */}
        <View style={styles.countRow}>
          <Text style={[typography.bodySmall, styles.countText]}>
            {loading ? 'Refreshing curriculum...' : `${courses.length} Masterclasses available`}
          </Text>
        </View>

        {/* Error Notification */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadCourses} />
          </View>
        ) : null}

        {/* Content Section */}
        {loading && !refreshing ? (
          <View style={styles.skeletonContainer}>
            <SkeletonCard style={styles.skeletonItem} />
            <SkeletonCard style={styles.skeletonItem} />
          </View>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No Masterclasses Found"
            description="No courses match the current category or filter combination."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory('all');
              loadCourses();
            }}
          />
        ) : (
          <View style={styles.coursesList}>
            {/* Lead Flagship Card */}
            {featuredCourse ? (
              <View style={styles.featuredSection}>
                <CourseCardLarge
                  eyebrow="FLAGSHIP CURRICULUM"
                  title={featuredCourse.title}
                  description={featuredCourse.subtitle}
                  imageUri={featuredCourse.thumbnailUrl}
                  tagLabel={featuredCourse.priceInr === 0 ? 'FREE' : 'VENTURE COHORT'}
                  timeLabel={`${Math.round((featuredCourse.stats?.durationSec || 3600) / 3600)}h runtime`}
                  metaChips={[
                    featuredCourse.level.toUpperCase(),
                    `${featuredCourse.stats?.lessonCount || 24} LESSONS`,
                    featuredCourse.priceInr === 0
                      ? 'FREE ACCESS'
                      : `₹${(featuredCourse.priceInr / 100).toLocaleString('en-IN')}`,
                  ]}
                  instructorName={featuredCourse.instructors?.[0]?.name || 'SOFE Fellows'}
                  rating={featuredCourse.stats?.ratingAvg || 4.9}
                  ratingCount={featuredCourse.stats?.ratingCount || 120}
                  ctaLabel="View Masterclass →"
                  onCtaPress={() => router.push(`/learn/course/${featuredCourse.slug}` as never)}
                />
              </View>
            ) : null}

            {/* Remaining Courses Rows */}
            {remainingCourses.length > 0 ? (
              <View style={styles.rowsContainer}>
                {remainingCourses.map((c) => (
                  <CourseCardRow
                    key={c.id}
                    title={c.title}
                    thumbnailUrl={c.thumbnailUrl}
                    label={c.level.toUpperCase()}
                    metaText={`${Math.round((c.stats?.durationSec || 3600) / 3600)}h · ${c.stats?.lessonCount || 16} lessons · ${c.priceInr === 0 ? 'Free' : `₹${c.priceInr / 100}`}`}
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
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  navIconButton: {
    padding: spacing.xs,
    borderRadius: spacing.sm,
  },
  navTitle: {
    color: palette.navy,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  filterChipScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  countText: {
    color: palette.slate,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  skeletonItem: {
    width: '100%',
  },
  coursesList: {
    marginTop: spacing.sm,
  },
  featuredSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  rowsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  cardRow: {
    marginBottom: spacing.xs,
  },
});
