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
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  FolderDown,
  HelpCircle,
  PlayCircle,
  Video,
} from 'lucide-react-native';
import { palette, radius, spacing } from '@sofe/shared';
import { typography } from '../../../../src/theme/typography';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  SectionHeader,
  SkeletonCard,
  TagChip,
} from '../../../../src/components';
import {
  learnApi,
  ApiEnrolledCurriculum,
  ApiEnrolledLesson,
  ApiEnrolledModule,
} from '../../../../src/lib/learn-api';

const FALLBACK_CURRICULUM: ApiEnrolledCurriculum = {
  courseId: 'c-flagship',
  courseTitle: 'Foundations of High-Growth Venture Building',
  modules: [
    {
      id: 'm-1',
      title: 'Module 1: Problem-Solution Fit & Validated Urgency',
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
          status: 'completed',
          watchedSec: 1080,
          percent: 100,
        },
        {
          id: 'l-2',
          title: 'Customer Discovery: Asking Questions That Hurt',
          type: 'reading',
          durationSec: 720,
          order: 2,
          isFreePreview: true,
          isRequired: true,
          status: 'completed',
          watchedSec: 720,
          percent: 100,
        },
        {
          id: 'l-3',
          title: 'Minimum Viable Signal vs. MVP',
          type: 'video',
          durationSec: 1440,
          order: 3,
          isFreePreview: false,
          isRequired: true,
          status: 'in_progress',
          watchedSec: 540,
          percent: 38,
        },
        {
          id: 'l-4',
          title: 'Check Your Signal: PMF Diagnostic Quiz',
          type: 'quiz',
          durationSec: 600,
          order: 4,
          isFreePreview: false,
          isRequired: true,
          status: 'not_started',
          watchedSec: 0,
          percent: 0,
        },
      ],
    },
    {
      id: 'm-2',
      title: 'Module 2: Unit Economics & Capital Allocation',
      order: 2,
      lessons: [
        {
          id: 'l-5',
          title: 'Deconstructing CAC: Payback & LTV Ratios',
          type: 'video',
          durationSec: 1800,
          order: 1,
          isFreePreview: false,
          isRequired: true,
          status: 'not_started',
          watchedSec: 0,
          percent: 0,
        },
        {
          id: 'l-6',
          title: 'Runway Extension & Cash Burn Discipline',
          type: 'reading',
          durationSec: 900,
          order: 2,
          isFreePreview: false,
          isRequired: true,
          status: 'not_started',
          watchedSec: 0,
          percent: 0,
        },
        {
          id: 'l-7',
          title: 'SAFE Notes and Cap Table Hygiene',
          type: 'reading',
          durationSec: 1100,
          order: 3,
          isFreePreview: false,
          isRequired: true,
          status: 'not_started',
          watchedSec: 0,
          percent: 0,
        },
      ],
    },
    {
      id: 'm-3',
      title: 'Module 3: Leadership, Culture & First 10 Hires',
      order: 3,
      lessons: [
        {
          id: 'l-8',
          title: 'The VP of Sales Archetype for Seed Stage',
          type: 'video',
          durationSec: 1200,
          order: 1,
          isFreePreview: false,
          isRequired: true,
          status: 'not_started',
          watchedSec: 0,
          percent: 0,
        },
        {
          id: 'l-9',
          title: 'Equity Grants and Vesting Cliff Negotiations',
          type: 'reading',
          durationSec: 840,
          order: 2,
          isFreePreview: false,
          isRequired: true,
          status: 'not_started',
          watchedSec: 0,
          percent: 0,
        },
      ],
    },
  ],
};

export default function EnrolledCurriculumScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [curriculum, setCurriculum] = useState<ApiEnrolledCurriculum>(FALLBACK_CURRICULUM);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurriculum = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const res = await learnApi.getCourseCurriculum(slug);
      if (res?.data && res.data.modules?.length > 0) {
        setCurriculum(res.data);
      } else {
        setCurriculum(FALLBACK_CURRICULUM);
      }
    } catch {
      setError('Unable to fetch live progress. Showing offline curriculum.');
      setCurriculum(FALLBACK_CURRICULUM);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCurriculum();
  };

  // Compute aggregate statistics
  const allLessons: ApiEnrolledLesson[] = curriculum.modules.flatMap(
    (m: ApiEnrolledModule) => m.lessons,
  );
  const requiredLessons = allLessons.filter((l: ApiEnrolledLesson) => l.isRequired);
  const completedLessons = requiredLessons.filter(
    (l: ApiEnrolledLesson) => l.status === 'completed',
  );
  const percentCompleted =
    requiredLessons.length > 0
      ? Math.round((completedLessons.length / requiredLessons.length) * 100)
      : 0;

  // Find next lesson to resume
  const nextLesson =
    allLessons.find((l: ApiEnrolledLesson) => l.status === 'in_progress') ||
    allLessons.find((l: ApiEnrolledLesson) => l.status === 'not_started') ||
    allLessons[0];

  const renderLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={16} color={palette.orangeDeep} />;
      case 'reading':
        return <BookOpen size={16} color={palette.navy} />;
      case 'quiz':
        return <HelpCircle size={16} color={palette.gold} />;
      default:
        return <FileText size={16} color={palette.slate} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <Text style={[typography.title, styles.navTitle]} numberOfLines={1}>
          {curriculum.courseTitle}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/learn/course/${slug}/resources` as never)}
          style={styles.navButton}
          accessibilityLabel="Course resources"
        >
          <FolderDown size={20} color={palette.navy} />
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
        {/* Course Progress Dashboard Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={[typography.caption, styles.progressEyebrow]}>
              ACTIVE CURRICULUM · ENROLLED
            </Text>
            <TagChip
              label={percentCompleted === 100 ? 'COMPLETED' : `${percentCompleted}% COMPLETE`}
              variant={percentCompleted === 100 ? 'dark' : 'orange'}
            />
          </View>

          <Text style={[typography.h2, styles.courseTitle]}>{curriculum.courseTitle}</Text>

          <View style={styles.progressBarWrapper}>
            <ProgressBar progress={percentCompleted} height={6} />
          </View>

          <View style={styles.progressMetrics}>
            <Text style={[typography.bodySmall, styles.metricText]}>
              {completedLessons.length} of {requiredLessons.length} Required Lessons Finished
            </Text>
            {percentCompleted === 100 ? (
              <TouchableOpacity
                onPress={() => router.push(`/learn/course/${slug}/complete` as never)}
              >
                <Text style={[typography.labelSmall, styles.certificateLink]}>
                  View Certificate →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Resume Action Button */}
          {nextLesson && percentCompleted < 100 ? (
            <View style={styles.resumeContainer}>
              <Button
                variant="primary"
                fullWidth
                onPress={() => router.push(`/learn/lesson/${nextLesson.id}` as never)}
              >
                Resume: {nextLesson.title} →
              </Button>
            </View>
          ) : null}
        </Card>

        {/* Error notification */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadCurriculum} />
          </View>
        ) : null}

        {/* Modules & Lessons Section */}
        {loading && !refreshing ? (
          <View style={styles.skeletonContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : curriculum.modules.length === 0 ? (
          <EmptyState
            title="Curriculum Unavailable"
            description="No modules are published for this course yet."
          />
        ) : (
          <View style={styles.modulesContainer}>
            <SectionHeader
              title="Course Modules"
              hasOrangeBar
              actionLabel={`${allLessons.length} Lessons`}
            />

            {curriculum.modules.map((mod: ApiEnrolledModule, modIdx: number) => (
              <Card key={mod.id || modIdx} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <Text style={[typography.caption, styles.moduleEyebrow]}>
                    MODULE 0{mod.order || modIdx + 1}
                  </Text>
                  <Text style={[typography.h3, styles.moduleTitle]}>{mod.title}</Text>
                </View>

                <View style={styles.lessonsList}>
                  {mod.lessons.map((lesson: ApiEnrolledLesson) => {
                    const isCompleted = lesson.status === 'completed';
                    const isInProgress = lesson.status === 'in_progress';

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        activeOpacity={0.8}
                        style={[styles.lessonRow, isInProgress && styles.lessonRowActive]}
                        onPress={() => router.push(`/learn/lesson/${lesson.id}` as never)}
                      >
                        {/* Status Checkmark / Indicator */}
                        <View style={styles.statusIndicator}>
                          {isCompleted ? (
                            <CheckCircle2 size={20} color={palette.orangeDeep} />
                          ) : isInProgress ? (
                            <PlayCircle size={20} color={palette.orange} />
                          ) : (
                            <Circle size={20} color={palette.line} />
                          )}
                        </View>

                        {/* Lesson Details */}
                        <View style={styles.lessonInfo}>
                          <View style={styles.lessonMetaTop}>
                            <View style={styles.typeBadge}>
                              {renderLessonIcon(lesson.type)}
                              <Text style={[typography.caption, styles.typeText]}>
                                {lesson.type.toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[typography.caption, styles.durationText]}>
                              {Math.round(lesson.durationSec / 60)} min
                            </Text>
                          </View>

                          <Text
                            style={[
                              typography.body,
                              styles.lessonTitle,
                              isCompleted && styles.lessonTitleCompleted,
                            ]}
                            numberOfLines={2}
                          >
                            {lesson.title}
                          </Text>

                          {isInProgress ? (
                            <View style={styles.lessonProgressTrack}>
                              <ProgressBar progress={lesson.percent} height={3} />
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            ))}
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
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  progressCard: {
    backgroundColor: palette.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressEyebrow: {
    color: palette.orangeDeep,
  },
  courseTitle: {
    color: palette.navy,
  },
  progressBarWrapper: {
    marginTop: spacing.xs,
  },
  progressMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricText: {
    color: palette.slate,
  },
  certificateLink: {
    color: palette.orangeDeep,
  },
  resumeContainer: {
    marginTop: spacing.sm,
  },
  errorContainer: {
    marginBottom: spacing.xs,
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  modulesContainer: {
    gap: spacing.lg,
  },
  moduleCard: {
    backgroundColor: palette.white,
    padding: spacing.md,
    gap: spacing.md,
  },
  moduleHeader: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    paddingBottom: spacing.sm,
  },
  moduleEyebrow: {
    color: palette.orangeDeep,
  },
  moduleTitle: {
    color: palette.navy,
  },
  lessonsList: {
    gap: spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
    backgroundColor: palette.cream,
  },
  lessonRowActive: {
    backgroundColor: palette.peachTint,
    borderWidth: 1,
    borderColor: palette.orange,
  },
  statusIndicator: {
    marginTop: spacing.xs,
  },
  lessonInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  lessonMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeText: {
    color: palette.slate,
  },
  durationText: {
    color: palette.slate,
  },
  lessonTitle: {
    color: palette.navy,
  },
  lessonTitleCompleted: {
    color: palette.mutedOnLight,
  },
  lessonProgressTrack: {
    marginTop: spacing.xs,
  },
});
