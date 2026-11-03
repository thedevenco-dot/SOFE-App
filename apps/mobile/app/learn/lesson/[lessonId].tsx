import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  Bookmark,
  Check,
  ChevronLeft,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';
import { palette, radius, spacing, shadows } from '@sofe/shared';
import { typography } from '../../../src/theme/typography';
import {
  Button,
  Card,
  ErrorState,
  ProgressBar,
  QuoteBox,
  SkeletonCard,
  TagChip,
  TimeChip,
} from '../../../src/components';
import { learnApi, ApiLessonDetail, ApiLessonProgress } from '../../../src/lib/learn-api';

const FALLBACK_LESSON: ApiLessonDetail = {
  id: 'l-1',
  courseId: 'c-flagship',
  moduleId: 'm-1',
  title: 'The Problem-Solution Fit Matrix',
  type: 'video',
  order: 1,
  isFreePreview: true,
  isRequired: true,
  durationSec: 1080,
  video: {
    mux: {
      playbackId: 'test-mux-playback-id',
      status: 'ready',
    },
  },
  reading: {
    bodyHtml:
      '<p>Before building product features, venture founders must rigorously pressure-test customer urgency. The Problem-Solution Fit Matrix maps customer pain intensity against willingness to pay.</p><p>High urgency problems exhibit three observable characteristics: immediate budget reallocation, executive sponsor involvement, and dissatisfaction with existing spreadsheet or manual workarounds.</p><p>Validate your value hypothesis by conducting non-leading customer discovery interviews. Ask questions that quantify the cost of inaction rather than pitching your proposed product.</p>',
  },
};

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is the most definitive indicator of genuine customer urgency?',
    options: [
      'Positive verbal feedback during a demo call',
      'Immediate willingness to reallocate existing operational budget',
      'Signing up for an email newsletter waitlist',
      'High social media engagement on a launch post',
    ],
    correctAnswer: 1,
    explanation:
      'Budget reallocation is the ultimate validation signal. Verbal enthusiasm without financial conviction is false traction.',
  },
  {
    id: 'q2',
    question: 'Why do spreadsheet workarounds indicate an attractive market opportunity?',
    options: [
      'Spreadsheets are easy to clone',
      'Customers have already self-organized an imperfect workflow to alleviate burning pain',
      'Microsoft will partner with you',
      'It proves there are no venture competitors',
    ],
    correctAnswer: 1,
    explanation:
      'A manual spreadsheet workaround proves that the problem is severe enough that the operator took time to build their own interim solution.',
  },
];

export default function LessonViewerScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [lesson, setLesson] = useState<ApiLessonDetail>(FALLBACK_LESSON);
  const [progress, setProgress] = useState<ApiLessonProgress | null>(null);
  const [playbackToken, setPlaybackToken] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedSec, setWatchedSec] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLesson = useCallback(async () => {
    if (!lessonId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await learnApi.getLesson(lessonId);
      if (res?.data?.lesson) {
        setLesson(res.data.lesson);
        setProgress(res.data.progress);
        if (res.data.progress) {
          setWatchedSec(res.data.progress.watchedSec || 0);
          setIsCompleted(res.data.progress.status === 'completed');
        }

        // Fetch Mux playback token if video
        if (res.data.lesson.type === 'video') {
          try {
            const tokenRes = await learnApi.getPlaybackToken(lessonId);
            if (tokenRes?.data?.playbackToken) {
              setPlaybackToken(tokenRes.data.playbackToken);
            }
          } catch {
            // Use mock playback token if offline
            setPlaybackToken('mock-signed-playback-token');
          }
        }
      }
    } catch {
      setError('Offline mode: viewing offline curriculum lesson.');
      setLesson({
        ...FALLBACK_LESSON,
        id: lessonId,
      });
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  // Video progress reporting
  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      // Simulate advance of watched seconds
      const nextSec = Math.min(lesson.durationSec || 600, watchedSec + 60);
      setWatchedSec(nextSec);
      const percent = Math.min(100, Math.round((nextSec / (lesson.durationSec || 600)) * 100));
      learnApi
        .updateLessonProgress(lesson.id, {
          watchedSec: nextSec,
          percent,
          completed: percent >= 90,
        })
        .catch(() => null);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distance = contentSize.height - layoutMeasurement.height;
    if (distance > 0) {
      const scrollPercent = Math.min(
        100,
        Math.max(0, Math.round((contentOffset.y / distance) * 100)),
      );
      setReadingProgress(scrollPercent);
      if (scrollPercent > 80 && !isCompleted) {
        setIsCompleted(true);
        learnApi
          .updateLessonProgress(lesson.id, {
            watchedSec: 0,
            percent: 100,
            completed: true,
          })
          .catch(() => null);
      }
    }
  };

  const handleQuizAnswer = (qId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const handleQuizSubmit = async () => {
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    if (score >= 80) {
      setIsCompleted(true);
    }

    try {
      await learnApi.submitLessonQuiz(lesson.id, score);
    } catch {
      // offline fallback
    }
  };

  const handleCompleteAndContinue = async () => {
    try {
      await learnApi.updateLessonProgress(lesson.id, {
        watchedSec: lesson.durationSec || 600,
        percent: 100,
        completed: true,
      });
    } catch {
      // offline
    }

    // Navigate to curriculum or celebration
    router.push(`/learn/course/${lesson.courseId}/curriculum` as never);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const videoProgressPercent = lesson.durationSec
    ? Math.min(100, (watchedSec / lesson.durationSec) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={palette.navy} />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={[typography.caption, styles.navEyebrow]}>
            LESSON 0{lesson.order} · {lesson.type.toUpperCase()}
          </Text>
          <Text style={[typography.label, styles.navTitle]} numberOfLines={1}>
            {lesson.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsBookmarked(!isBookmarked)}
          style={styles.navButton}
          accessibilityLabel="Bookmark lesson"
        >
          <Bookmark
            size={20}
            color={isBookmarked ? palette.orange : palette.navy}
            fill={isBookmarked ? palette.orange : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={lesson.type === 'reading' ? handleScroll : undefined}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading Skeleton */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : null}

        {/* Error notification */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState message={error} retryLabel="Retry" onRetry={loadLesson} />
          </View>
        ) : null}

        {/* 1. VIDEO VARIANT (LN8) */}
        {lesson.type === 'video' ? (
          <View style={styles.videoSection}>
            <View style={styles.videoPlayerContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
                }}
                style={styles.videoPoster}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handleTogglePlay}
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause size={28} color={palette.cream} fill={palette.cream} />
                  ) : (
                    <Play
                      size={28}
                      color={palette.cream}
                      fill={palette.cream}
                      style={styles.playOffset}
                    />
                  )}
                </TouchableOpacity>

                {/* Progress bar overlay */}
                <View style={styles.videoControlsBottom}>
                  <ProgressBar progress={videoProgressPercent} height={4} />
                  <View style={styles.videoTimeRow}>
                    <Text style={[typography.caption, styles.videoTimeText]}>
                      {formatSeconds(watchedSec)} / {formatSeconds(lesson.durationSec || 600)}
                    </Text>
                    <TouchableOpacity accessibilityLabel="Fullscreen">
                      <Maximize2 size={16} color={palette.cream} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.lessonMetaBody}>
              <View style={styles.badgesRow}>
                <TagChip label="HD VIDEO STREAM" variant="orange" />
                {playbackToken ? <TagChip label="VERIFIED" variant="dark" /> : null}
                {isCompleted || progress?.status === 'completed' ? (
                  <TagChip label="COMPLETED" variant="dark" />
                ) : null}
              </View>
              <Text style={[typography.h2, styles.lessonHeading]}>{lesson.title}</Text>
              <Text style={[typography.body, styles.lessonSynopsis]}>
                In this masterclass lesson, we explore customer urgency indicators, discovery
                interview frameworks, and the signals required before writing production code.
              </Text>
            </View>
          </View>
        ) : null}

        {/* 2. READING VARIANT (LN9) */}
        {lesson.type === 'reading' ? (
          <View style={styles.readingSection}>
            <View style={styles.readingHeader}>
              <TimeChip label={`${Math.round((lesson.durationSec || 600) / 60)} min read`} />
              <ProgressBar
                progress={readingProgress}
                height={4}
                style={styles.readingProgressBar}
              />
            </View>

            <Text style={[typography.display, styles.readingTitle]}>{lesson.title}</Text>

            <QuoteBox
              quote="Ask questions that hurt. If your customer discovery calls don't challenge your core assumptions, you are seeking validation rather than truth."
              author="Naveen Jain · SOFE Masterclass"
              style={styles.readingQuote}
            />

            <View style={styles.readingContent}>
              <Text style={[typography.body, styles.paragraphText]}>
                Before building product features, venture founders must rigorously pressure-test
                customer urgency. The Problem-Solution Fit Matrix maps customer pain intensity
                against willingness to pay.
              </Text>
              <Text style={[typography.body, styles.paragraphText]}>
                High urgency problems exhibit three observable characteristics: immediate budget
                reallocation, executive sponsor involvement, and dissatisfaction with existing
                spreadsheet or manual workarounds.
              </Text>
              <Text style={[typography.body, styles.paragraphText]}>
                Validate your value hypothesis by conducting non-leading customer discovery
                interviews. Ask questions that quantify the cost of inaction rather than pitching
                your proposed product.
              </Text>
            </View>
          </View>
        ) : null}

        {/* 3. QUIZ VARIANT (LN10) */}
        {lesson.type === 'quiz' ? (
          <View style={styles.quizSection}>
            <View style={styles.quizHeader}>
              <Text style={[typography.caption, styles.quizEyebrow]}>KNOWLEDGE CHECK</Text>
              <Text style={[typography.h2, styles.quizTitle]}>{lesson.title}</Text>
              <Text style={[typography.bodySmall, styles.quizSubtitle]}>
                Pass with 80% or higher to complete this requirement.
              </Text>
            </View>

            {/* Score Result Card */}
            {quizSubmitted ? (
              <Card
                style={[styles.resultCard, quizScore >= 80 ? styles.resultPass : styles.resultFail]}
              >
                <View style={styles.resultIconWrap}>
                  {quizScore >= 80 ? (
                    <Sparkles size={24} color={palette.orangeDeep} />
                  ) : (
                    <RotateCcw size={24} color={palette.slate} />
                  )}
                </View>
                <View style={styles.resultTextWrap}>
                  <Text style={[typography.h3, styles.resultTitle]}>
                    {quizScore >= 80 ? 'Requirement Passed!' : 'Review & Retry'}
                  </Text>
                  <Text style={[typography.bodySmall, styles.resultSubtitle]}>
                    Score: {quizScore}% (
                    {quizScore >= 80 ? 'Mastery verified' : '80% required to unlock'})
                  </Text>
                </View>
              </Card>
            ) : null}

            {/* Questions List */}
            <View style={styles.questionsContainer}>
              {QUIZ_QUESTIONS.map((q, idx) => (
                <Card key={q.id} style={styles.questionCard}>
                  <Text style={[typography.labelSmall, styles.questionNumber]}>
                    QUESTION {idx + 1} OF {QUIZ_QUESTIONS.length}
                  </Text>
                  <Text style={[typography.h3, styles.questionText]}>{q.question}</Text>

                  <View style={styles.optionsList}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[q.id] === optIdx;
                      const isCorrect = optIdx === q.correctAnswer;
                      const showResult = quizSubmitted;

                      return (
                        <TouchableOpacity
                          key={optIdx}
                          style={[
                            styles.optionItem,
                            isSelected && styles.optionSelected,
                            showResult && isCorrect && styles.optionCorrect,
                            showResult && isSelected && !isCorrect && styles.optionIncorrect,
                          ]}
                          onPress={() => handleQuizAnswer(q.id, optIdx)}
                          disabled={quizSubmitted}
                        >
                          <Text
                            style={[
                              typography.body,
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                              showResult && isCorrect && styles.optionLabelCorrect,
                            ]}
                          >
                            {opt}
                          </Text>
                          {showResult && isCorrect ? (
                            <Check size={18} color={palette.orangeDeep} />
                          ) : showResult && isSelected && !isCorrect ? (
                            <X size={18} color={palette.slate} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {quizSubmitted ? (
                    <View style={styles.explanationBox}>
                      <Text style={[typography.caption, styles.explanationLabel]}>EXPLANATION</Text>
                      <Text style={[typography.bodySmall, styles.explanationText]}>
                        {q.explanation}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>

            {/* Submit Quiz Button */}
            {!quizSubmitted ? (
              <Button
                variant="primary"
                fullWidth
                onPress={handleQuizSubmit}
                disabled={Object.keys(selectedAnswers).length < QUIZ_QUESTIONS.length}
              >
                Submit Answers →
              </Button>
            ) : quizScore < 80 ? (
              <Button
                variant="secondary"
                fullWidth
                onPress={() => {
                  setQuizSubmitted(false);
                  setSelectedAnswers({});
                }}
              >
                Try Again
              </Button>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Progression Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={() => router.back()}
          accessibilityLabel="Previous"
        >
          <ChevronLeft size={20} color={palette.navy} />
          <Text style={[typography.labelSmall, styles.prevText]}>Curriculum</Text>
        </TouchableOpacity>

        <View style={styles.nextActionWrap}>
          <Button variant="primary" onPress={handleCompleteAndContinue}>
            {isCompleted ? 'Next Lesson →' : 'Complete & Continue →'}
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
    backgroundColor: palette.cream,
  },
  navButton: {
    padding: spacing.xs,
  },
  navTitleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  navEyebrow: {
    color: palette.orangeDeep,
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
  skeletonContainer: {
    gap: spacing.md,
  },
  errorContainer: {
    marginBottom: spacing.xs,
  },
  videoSection: {
    gap: spacing.lg,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: palette.navy,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPoster: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.75,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 30, 48, 0.4)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  playOffset: {
    marginLeft: 3,
  },
  videoControlsBottom: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    gap: spacing.xs,
  },
  videoTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTimeText: {
    color: palette.cream,
  },
  lessonMetaBody: {
    gap: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  lessonHeading: {
    color: palette.navy,
  },
  lessonSynopsis: {
    color: palette.slate,
    lineHeight: 22,
  },
  readingSection: {
    gap: spacing.lg,
  },
  readingHeader: {
    gap: spacing.sm,
  },
  readingProgressBar: {
    width: '100%',
  },
  readingTitle: {
    color: palette.navy,
  },
  readingQuote: {
    marginVertical: spacing.xs,
  },
  readingContent: {
    gap: spacing.md,
  },
  paragraphText: {
    color: palette.navy,
    lineHeight: 24,
  },
  quizSection: {
    gap: spacing.lg,
  },
  quizHeader: {
    gap: spacing.xs,
  },
  quizEyebrow: {
    color: palette.orangeDeep,
  },
  quizTitle: {
    color: palette.navy,
  },
  quizSubtitle: {
    color: palette.slate,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  resultPass: {
    backgroundColor: palette.peachTint,
    borderColor: palette.orange,
    borderWidth: 1,
  },
  resultFail: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
  },
  resultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  resultTitle: {
    color: palette.navy,
  },
  resultSubtitle: {
    color: palette.slate,
  },
  questionsContainer: {
    gap: spacing.lg,
  },
  questionCard: {
    backgroundColor: palette.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  questionNumber: {
    color: palette.orangeDeep,
  },
  questionText: {
    color: palette.navy,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: palette.line,
  },
  optionSelected: {
    borderColor: palette.orange,
    backgroundColor: palette.peachTint,
  },
  optionCorrect: {
    borderColor: palette.orangeDeep,
    backgroundColor: palette.peachTint,
  },
  optionIncorrect: {
    borderColor: palette.slate,
    backgroundColor: palette.white,
  },
  optionLabel: {
    color: palette.navy,
    flex: 1,
  },
  optionLabelSelected: {
    color: palette.orangeDeep,
    fontFamily: 'Inter_600SemiBold',
  },
  optionLabelCorrect: {
    color: palette.orangeDeep,
    fontFamily: 'Inter_600SemiBold',
  },
  explanationBox: {
    backgroundColor: palette.cream,
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: palette.orange,
  },
  explanationLabel: {
    color: palette.orangeDeep,
  },
  explanationText: {
    color: palette.slate,
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.cream,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    gap: spacing.md,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  prevText: {
    color: palette.navy,
  },
  nextActionWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
