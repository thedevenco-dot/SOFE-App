import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Clock, Lock, Play, Share2, Star, Users } from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../../src/theme/typography';
import { Avatar, Button, Card, QuoteCard, SectionHeader, TagChip } from '../../../src/components';
import { learnApi, ApiCourse, ApiCourseModule } from '../../../src/lib/learn-api';

const FALLBACK_COURSE: ApiCourse = {
  id: 'c-flagship',
  slug: 'foundations-of-high-growth-venture-building',
  title: 'Foundations of High-Growth Venture Building',
  subtitle: 'From zero to repeatable PMF, unit economics, and an enduring core leadership team.',
  descriptionHtml:
    'An intensive, operator-led masterclass designed specifically for venture-backed founders. Learn battle-tested strategies for building repeatable outbound funnels, capital efficiency models, and hiring your first 10 core executives.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  level: 'intermediate',
  priceInr: 1499900,
  compareAtPriceInr: 2499900,
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
      bio: 'Former 2x unicorn founder and GP at SOFE Ventures. Has mentored over 140 founders across Series Seed through Series B.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
  ],
  modules: [
    {
      id: 'm-1',
      title: 'Module 1: High-Conviction Idea Validation & PMF',
      order: 1,
      lessons: [
        {
          id: 'l-1',
          title: 'The Problem-Solution Fit Matrix',
          type: 'video',
          durationSec: 1080,
          order: 1,
          isFreePreview: true,
          isRequired: true,
        },
        {
          id: 'l-2',
          title: 'Customer Discovery: Asking Questions That Hurt',
          type: 'reading',
          durationSec: 720,
          order: 2,
          isFreePreview: true,
          isRequired: true,
        },
        {
          id: 'l-3',
          title: 'Minimum Viable Signal vs. MVP',
          type: 'video',
          durationSec: 1440,
          order: 3,
          isFreePreview: false,
          isRequired: true,
        },
      ],
    },
    {
      id: 'm-2',
      title: 'Module 2: Unit Economics & Capital Strategy',
      order: 2,
      lessons: [
        {
          id: 'l-4',
          title: 'Deconstructing CAC: Payback & LTV Ratios',
          type: 'video',
          durationSec: 1800,
          order: 1,
          isFreePreview: false,
          isRequired: true,
        },
        {
          id: 'l-5',
          title: 'Runway Extension & Cash Burn Discipline',
          type: 'reading',
          durationSec: 900,
          order: 2,
          isFreePreview: false,
          isRequired: true,
        },
      ],
    },
    {
      id: 'm-3',
      title: 'Module 3: Leadership, Culture & First 10 Hires',
      order: 3,
      lessons: [
        {
          id: 'l-6',
          title: 'The VP of Sales Archetype for Seed Stage',
          type: 'video',
          durationSec: 1200,
          order: 1,
          isFreePreview: false,
          isRequired: true,
        },
        {
          id: 'l-7',
          title: 'Equity Grants and Cliff Negotiations',
          type: 'reading',
          durationSec: 840,
          order: 2,
          isFreePreview: false,
          isRequired: true,
        },
      ],
    },
  ],
};

export default function CourseDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [course, setCourse] = useState<ApiCourse>(FALLBACK_COURSE);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const loadCourse = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await learnApi.getCourseBySlug(slug);
      if (res) {
        setCourse(res);
      }
    } catch {
      // Use fallback course if slug matches or offline
      if (slug !== FALLBACK_COURSE.slug) {
        setCourse({
          ...FALLBACK_COURSE,
          title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug,
        });
      }
    }
  }, [slug]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: course.title,
        message: `${course.title}\n\nMaster this discipline on SOFE: https://sofe.app/learn/course/${course.slug}`,
      });
    } catch {
      // Share cancelled
    }
  };

  const instructor = course.instructors?.[0] || FALLBACK_COURSE.instructors?.[0];
  const hours = Math.round((course.stats?.durationSec || 64800) / 3600);
  const priceDisplay =
    course.priceInr === 0 ? 'Free Access' : `₹${(course.priceInr / 100).toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.labelSmall, styles.navCategory]}>
          {typeof course.categoryId === 'object'
            ? course.categoryId.name.toUpperCase()
            : 'VENTURE MASTERCLASS'}
        </Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={styles.navButton}
            accessibilityLabel="Bookmark"
          >
            <Bookmark
              size={20}
              color={isBookmarked ? palette.orange : palette.navy}
              fill={isBookmarked ? palette.orange : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.navButton}
            accessibilityLabel="Share"
          >
            <Share2 size={20} color={palette.navy} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Course Hero Media */}
        <View style={styles.heroMediaContainer}>
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.previewOverlay}>
            <View style={styles.playCircle}>
              <Play size={24} color={palette.cream} fill={palette.cream} />
            </View>
            <Text style={[typography.labelSmall, styles.previewText]}>Preview Curriculum</Text>
          </View>
          <View style={styles.tagBadge}>
            <TagChip label={course.level.toUpperCase()} variant="orange" />
          </View>
        </View>

        {/* Main Details Body */}
        <View style={styles.detailsBody}>
          <Text style={[typography.h1, styles.courseTitle]}>{course.title}</Text>
          {course.subtitle ? (
            <Text style={[typography.body, styles.courseSubtitle]}>{course.subtitle}</Text>
          ) : null}

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Star size={16} color={palette.orange} fill={palette.orange} />
              <Text style={[typography.bodySmall, styles.metricText]}>
                {course.stats?.ratingAvg || 4.9} ({course.stats?.ratingCount || 150})
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Users size={16} color={palette.slate} />
              <Text style={[typography.bodySmall, styles.metricText]}>
                {course.stats?.enrolledCount || 850} Founders
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Clock size={16} color={palette.slate} />
              <Text style={[typography.bodySmall, styles.metricText]}>{hours} hrs runtime</Text>
            </View>
          </View>

          {/* Instructor Bio Section */}
          {instructor ? (
            <View style={styles.instructorCard}>
              <Avatar uri={instructor.avatarUrl} name={instructor.name} size={44} />
              <View style={styles.instructorDetails}>
                <Text style={[typography.label, styles.instructorName]}>{instructor.name}</Text>
                <Text style={[typography.caption, styles.instructorTitle]}>{instructor.title}</Text>
                {instructor.bio ? (
                  <Text style={[typography.bodySmall, styles.instructorBio]}>{instructor.bio}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Overview Statement */}
          <View style={styles.overviewSection}>
            <SectionHeader title="What You Will Master" hasOrangeBar />
            <Text style={[typography.body, styles.overviewText]}>
              {course.descriptionHtml
                ? course.descriptionHtml.replace(/<[^>]+>/g, '')
                : course.subtitle}
            </Text>
          </View>

          {/* Modules & Curriculum Breakdown */}
          <View style={styles.curriculumSection}>
            <SectionHeader
              title="Curriculum Structure"
              hasOrangeBar
              actionLabel={`${course.stats?.lessonCount || 24} Lessons`}
            />

            {(course.modules || FALLBACK_COURSE.modules || []).map((mod: ApiCourseModule) => (
              <Card key={mod.id} style={styles.moduleCard}>
                <Text style={[typography.h3, styles.moduleTitle]}>{mod.title}</Text>
                <View style={styles.lessonsList}>
                  {mod.lessons.map((lesson) => (
                    <View key={lesson.id} style={styles.lessonRow}>
                      <View style={styles.lessonLeft}>
                        {lesson.isFreePreview ? (
                          <View style={styles.freePlayIcon}>
                            <Play size={12} color={palette.orange} fill={palette.orange} />
                          </View>
                        ) : (
                          <Lock size={14} color={palette.slate} />
                        )}
                        <Text style={[typography.bodySmall, styles.lessonTitle]}>
                          {lesson.title}
                        </Text>
                      </View>
                      <View style={styles.lessonRight}>
                        {lesson.isFreePreview ? (
                          <TagChip label="PREVIEW" variant="orange" />
                        ) : (
                          <Text style={[typography.caption, styles.lessonDuration]}>
                            {Math.round(lesson.durationSec / 60)}m
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>

          {/* Testimonial Quote */}
          <View style={styles.quoteSection}>
            <QuoteCard
              quote="This masterclass gave our founding team the exact playbook we used to scale from our first 10 customers to Series A."
              author="Aarav Sharma"
              authorRole="Cohort '23 · Co-Founder, VectorOps"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Enrollment Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={[typography.caption, styles.priceEyebrow]}>INVESTMENT</Text>
          <Text style={[typography.h2, styles.priceText]}>{priceDisplay}</Text>
        </View>
        <View style={styles.ctaContainer}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push(`/learn/checkout/${course.id}` as never)}
          >
            Enroll in Masterclass →
          </Button>
        </View>
      </View>
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
  navCategory: {
    color: palette.orangeDeep,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  heroMediaContainer: {
    width: '100%',
    height: 220,
    backgroundColor: palette.navy,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  previewOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    ...shadows.soft,
  },
  previewText: {
    color: palette.cream,
  },
  tagBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
  },
  detailsBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  courseTitle: {
    color: palette.navy,
  },
  courseSubtitle: {
    color: palette.slate,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.line,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricText: {
    color: palette.navy,
  },
  instructorCard: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    gap: spacing.md,
  },
  instructorDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  instructorName: {
    color: palette.navy,
  },
  instructorTitle: {
    color: palette.orangeDeep,
  },
  instructorBio: {
    color: palette.slate,
    marginTop: spacing.xs,
  },
  overviewSection: {
    gap: spacing.sm,
  },
  overviewText: {
    color: palette.navy,
    lineHeight: 22,
  },
  curriculumSection: {
    gap: spacing.md,
  },
  moduleCard: {
    padding: spacing.md,
    backgroundColor: palette.white,
  },
  moduleTitle: {
    color: palette.navy,
    marginBottom: spacing.sm,
  },
  lessonsList: {
    gap: spacing.xs,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  freePlayIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.peachTint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  lessonTitle: {
    color: palette.navy,
    flex: 1,
  },
  lessonRight: {
    marginLeft: spacing.sm,
  },
  lessonDuration: {
    color: palette.slate,
  },
  quoteSection: {
    marginVertical: spacing.md,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.cream,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    gap: spacing.lg,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceEyebrow: {
    color: palette.slate,
  },
  priceText: {
    color: palette.navy,
  },
  ctaContainer: {
    flex: 1,
  },
});
