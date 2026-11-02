import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, SlidersHorizontal, Video } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../src/theme/typography';
import {
  AppHeader,
  Button,
  Card,
  ContentSheet,
  CourseCardGrid,
  CourseCardLarge,
  CourseCardRow,
  FilterChip,
  ProgressBar,
  QuoteCard,
  SearchBar,
  SectionHeader,
  SkeletonCard,
  TimeChip,
} from '../../src/components';
import { learnApi, ApiCategory, ApiCourse } from '../../src/lib/learn-api';

const FALLBACK_CATEGORIES: ApiCategory[] = [
  { id: 'all', name: 'All Masterclasses', slug: 'all' },
  { id: 'c1', name: 'Startups & Ideation', slug: 'startups-ideation' },
  { id: 'c2', name: 'Venture Strategy', slug: 'venture-strategy' },
  { id: 'c3', name: 'B2B SaaS Growth', slug: 'b2b-saas' },
  { id: 'c4', name: 'Go-To-Market', slug: 'go-to-market' },
];

const FALLBACK_FLAGSHIP_COURSE: ApiCourse = {
  id: 'c-flagship',
  slug: 'foundations-of-high-growth-venture-building',
  title: 'Foundations of High-Growth Venture Building',
  subtitle: 'From zero to repeatable PMF, fundable unit economics, and an enduring team.',
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
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
  ],
};

export default function LearnHomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATEGORIES);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [flagship, setFlagship] = useState<ApiCourse>(FALLBACK_FLAGSHIP_COURSE);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, catsRes, recRes] = await Promise.allSettled([
        learnApi.listCourses({ limit: 10 }),
        learnApi.getCategories(),
        learnApi.getRecommendedCourses(),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value?.length > 0) {
        setCategories([{ id: 'all', name: 'All Masterclasses', slug: 'all' }, ...catsRes.value]);
      }

      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data?.length > 0) {
        setCourses(coursesRes.value.data);
        setFlagship(coursesRes.value.data[0]);
      } else if (recRes.status === 'fulfilled' && recRes.value?.length > 0) {
        setCourses(recRes.value);
        setFlagship(recRes.value[0]);
      }
    } catch {
      // Keep fallbacks active
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        variant="title"
        title="Learn"
        subtitle="32 Courses · Term Active"
        onSearchPress={() => router.push('/learn/search' as never)}
      />

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
        <ContentSheet hasDragHandle>
          {/* Top Title & Search Block */}
          <View style={styles.sheetHeader}>
            <Text style={[typography.display, styles.sheetTitle]}>Master Execution</Text>
            <Text style={[typography.body, styles.sheetSubtitle]}>
              High-conviction frameworks taught by venture practitioners and experienced founders.
            </Text>

            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search masterclasses, books, talks..."
                />
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => router.push('/learn/filters' as never)}
                accessibilityLabel="Filter courses"
              >
                <SlidersHorizontal size={18} color={palette.navy} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. In-Progress Course Card */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              title="Resume Learning"
              actionLabel="Syllabus"
              onActionPress={() => router.push('/learn/courses' as never)}
            />
            <Card variant="white" style={styles.inProgressCard}>
              <View style={styles.inProgressRow}>
                <View style={styles.thumbnailWrapper}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
                    }}
                    style={styles.inProgressThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.timeBadge}>
                    <TimeChip label="18 mins left" />
                  </View>
                </View>

                <View style={styles.inProgressMeta}>
                  <Text style={[typography.eyebrow, styles.moduleBadge]}>MODULE 02 · TRACTION</Text>
                  <Text style={[typography.title3, styles.inProgressTitle]} numberOfLines={2}>
                    Venture Capital Mechanics: Term Sheets & Cap Tables
                  </Text>
                  <Text style={[typography.caption, styles.instructorText]}>
                    By Naveen Jain · Lesson 04 of 12
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={45}
                leftLabel="Curriculum Progress"
                rightLabel="45%"
                style={styles.progressMargin}
              />

              <Button
                variant="primary"
                onPress={() => router.push(`/learn/course/${flagship.slug}` as never)}
                style={styles.resumeButton}
              >
                Resume Masterclass →
              </Button>
            </Card>
          </View>

          {/* 4. Tracks & Focus Areas (FilterChips) */}
          <View style={styles.tracksSection}>
            <View style={styles.tracksHeader}>
              <Text style={[typography.eyebrow, styles.tracksEyebrow]}>TRACKS & FOCUS AREAS</Text>
              <Text style={[typography.micro, styles.swipeHint]}>Swipe horizontal</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  label={c.name}
                  selected={selectedCategory === c.slug}
                  onPress={() => {
                    setSelectedCategory(c.slug);
                    if (c.slug !== 'all') {
                      router.push({
                        pathname: '/learn/courses',
                        params: { category: c.slug },
                      } as never);
                    }
                  }}
                />
              ))}
            </ScrollView>
          </View>

          {/* Quick Jump Buttons: Books & Videos */}
          <View style={styles.quickJumpRow}>
            <TouchableOpacity
              style={styles.quickJumpCard}
              onPress={() => router.push('/learn/books' as never)}
            >
              <View style={styles.quickJumpIconWrap}>
                <BookOpen size={20} color={palette.orangeDeep} />
              </View>
              <View style={styles.quickJumpTextWrap}>
                <Text style={[typography.bodyStrong, styles.quickJumpTitle]}>Books Library</Text>
                <Text style={[typography.micro, styles.quickJumpSubtitle]}>
                  Curated reads & PDFs
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickJumpCard}
              onPress={() => router.push('/learn/videos' as never)}
            >
              <View style={styles.quickJumpIconWrap}>
                <Video size={20} color={palette.orangeDeep} />
              </View>
              <View style={styles.quickJumpTextWrap}>
                <Text style={[typography.bodyStrong, styles.quickJumpTitle]}>Founder Videos</Text>
                <Text style={[typography.micro, styles.quickJumpSubtitle]}>Masterclass talks</Text>
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <>
              {/* 5. Flagship Masterclass */}
              <View style={styles.sectionContainer}>
                <CourseCardLarge
                  imageUri={flagship.thumbnailUrl}
                  tagLabel="COHORT RECOMMENDED"
                  eyebrow="FLAGSHIP MASTERCLASS · 12 MODULES"
                  title={flagship.title}
                  description={flagship.subtitle}
                  metaChips={['Advanced Track', '18 Hours', '36 Lessons', 'Free for Fellows']}
                  instructors={[{ name: 'Naveen Jain' }]}
                  instructorName="Naveen Jain & Guest Partners"
                  rating={4.98}
                  ratingCount={312}
                  ctaLabel="Enroll in Masterclass →"
                  onCtaPress={() => router.push(`/learn/course/${flagship.slug}` as never)}
                />
              </View>

              {/* 6. Core Disciplines */}
              <View style={styles.sectionContainer}>
                <SectionHeader
                  title="Core Disciplines"
                  actionLabel="View all 32"
                  onActionPress={() => router.push('/learn/courses' as never)}
                />
                <View style={styles.gridRow}>
                  <CourseCardGrid
                    title={courses[1]?.title || 'Early Stage Sales Playbook'}
                    instructorName={courses[1]?.instructors?.[0]?.name || 'Priya Sharma'}
                    rating={courses[1]?.stats?.ratingAvg || 4.9}
                    metaText={`${courses[1]?.stats?.lessonCount || 6} Lessons · 4h`}
                    tagLabel={courses[1]?.level?.toUpperCase() || 'GTM Track'}
                    thumbnailUrl={
                      courses[1]?.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80'
                    }
                    onPress={() =>
                      router.push(`/learn/course/${courses[1]?.slug || 'sales-playbook'}` as never)
                    }
                    style={styles.gridHalf}
                  />
                  <CourseCardGrid
                    title={courses[2]?.title || 'Product Analytics & Loops'}
                    instructorName={courses[2]?.instructors?.[0]?.name || 'Arjun Mehta'}
                    rating={courses[2]?.stats?.ratingAvg || 4.88}
                    metaText={`${courses[2]?.stats?.lessonCount || 8} Lessons · 5h`}
                    tagLabel={courses[2]?.level?.toUpperCase() || 'Growth'}
                    thumbnailUrl={
                      courses[2]?.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80'
                    }
                    onPress={() =>
                      router.push(`/learn/course/${courses[2]?.slug || 'analytics-loops'}` as never)
                    }
                    style={styles.gridHalf}
                  />
                </View>

                <CourseCardRow
                  title={courses[3]?.title || 'Enterprise Contract Negotiation & Pricing Models'}
                  label={courses[3]?.level?.toUpperCase() || 'EXECUTIVE TRACK'}
                  metaText={`${courses[3]?.stats?.ratingAvg || 4.92} ★ · ${courses[3]?.stats?.lessonCount || 14} Lessons`}
                  thumbnailUrl={
                    courses[3]?.thumbnailUrl ||
                    'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80'
                  }
                  onPress={() =>
                    router.push(`/learn/course/${courses[3]?.slug || 'pricing-models'}` as never)
                  }
                  style={styles.rowMargin}
                />
              </View>

              {/* 7. QuoteCard */}
              <QuoteCard
                eyebrow="THE SOFE METHODOLOGY"
                quote="The SOFE curriculum bridges the gap between academic business school theory and the high-velocity, asymmetric reality of early-stage venture building."
                author="Kavita Rao"
                authorRole="Founder & CEO · Class of '24"
                style={styles.quoteMargin}
              />
            </>
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    color: palette.navy,
  },
  sheetSubtitle: {
    color: palette.navy,
    opacity: 0.8,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  searchWrap: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  inProgressCard: {
    padding: spacing.md,
  },
  inProgressRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbnailWrapper: {
    width: 100,
    height: 80,
    borderRadius: radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  inProgressThumbnail: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
  },
  inProgressMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  moduleBadge: {
    color: palette.orangeDeep,
  },
  inProgressTitle: {
    color: palette.navy,
    marginTop: 2,
    lineHeight: 18,
  },
  instructorText: {
    color: palette.navy,
    opacity: 0.6,
    marginTop: 2,
  },
  progressMargin: {
    marginTop: spacing.md,
  },
  resumeButton: {
    marginTop: spacing.md,
    width: '100%',
  },
  tracksSection: {
    marginTop: spacing.lg,
  },
  tracksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  tracksEyebrow: {
    color: palette.navy,
  },
  swipeHint: {
    color: palette.navy,
    opacity: 0.5,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  quickJumpRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  quickJumpCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.line,
    gap: spacing.sm,
    ...shadows.soft,
  },
  quickJumpIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickJumpTextWrap: {
    flex: 1,
  },
  quickJumpTitle: {
    color: palette.navy,
  },
  quickJumpSubtitle: {
    color: palette.navy,
    opacity: 0.6,
  },
  loadingContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  gridHalf: {
    flex: 1,
  },
  rowMargin: {
    marginTop: spacing.md,
  },
  quoteMargin: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
