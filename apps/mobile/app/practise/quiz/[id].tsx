import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Clock, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react-native';
import {
  palette,
  radius,
  spacing,
  type PublicQuizDto,
  type PublicQuizQuestion,
  type QuizAnswerSubmission,
} from '@sofe/shared';
import { useTheme } from '../../../src/theme/theme-context';
import { typography } from '../../../src/theme/typography';
import { Button } from '../../../src/components/Button';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { practiseApi } from '../../../src/lib/practise-api';

export default function QuizRunnerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<PublicQuizDto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const loadQuiz = useCallback(async () => {
    try {
      if (id && id !== 'default') {
        const fetched = await practiseApi.getPublicQuiz(id);
        setQuiz(fetched);
      } else {
        const today = await practiseApi.getTodayPractice();
        if (today.quickQuiz) {
          setQuiz(today.quickQuiz);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  // Pacing Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const questions: PublicQuizQuestion[] = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const currentSelected = selectedAnswers[qId] || [];

    if (currentQuestion.type === 'multi') {
      const alreadySelected = currentSelected.includes(optionId);
      const nextSelected = alreadySelected
        ? currentSelected.filter((item) => item !== optionId)
        : [...currentSelected, optionId];
      setSelectedAnswers((prev) => ({ ...prev, [qId]: nextSelected }));
    } else {
      // Single or True/False
      setSelectedAnswers((prev) => ({ ...prev, [qId]: [optionId] }));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Build submissions
    const submissions: QuizAnswerSubmission[] = Object.entries(selectedAnswers).map(
      ([questionId, selectedOptionIds]) => ({
        questionId,
        selectedOptionIds,
      }),
    );

    if (submissions.length < totalQuestions) {
      Alert.alert(
        'Incomplete Answers',
        `You have answered ${submissions.length} of ${totalQuestions} questions. Do you still want to submit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => doSubmit(submissions) },
        ],
      );
      return;
    }

    await doSubmit(submissions);
  };

  const doSubmit = async (submissions: QuizAnswerSubmission[]) => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const result = await practiseApi.submitQuiz(quiz.id, submissions);
      router.replace({
        pathname: `/practise/quiz/${quiz.id}/result`,
        params: { attemptId: result.attemptId },
      } as never);
    } catch {
      Alert.alert(
        'Submission Error',
        'Failed to submit quiz. Please check your network and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Drill?',
      'Your progress for this attempt will not be saved until you submit.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <HelpCircle size={48} color={palette.mutedOnLight} />
          <Text style={[typography.title2, { color: colors.text, marginTop: spacing.md }]}>
            Drill Unavailable
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
            ]}
          >
            This quiz is currently being calibrated by the editorial team. Please try another daily
            workout slot.
          </Text>
          <Button
            variant="secondary"
            style={{ marginTop: spacing.lg }}
            onPress={() => router.back()}
          >
            Return to Practise
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const currentSelectedOptions = currentQuestion ? selectedAnswers[currentQuestion.id] || [] : [];
  const isAnswerSelected = currentSelectedOptions.length > 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header Runner Bar */}
      <View style={[styles.headerBar, { borderColor: palette.line }]}>
        <TouchableOpacity
          onPress={handleExit}
          style={styles.exitButton}
          accessibilityLabel="Exit Quiz"
        >
          <X size={20} color={palette.navy} />
        </TouchableOpacity>

        <View style={styles.timerChip}>
          <Clock size={14} color={palette.mutedOnLight} />
          <Text
            style={[typography.caption, { color: palette.mutedOnLight, marginLeft: spacing.xs }]}
          >
            {formatTimer(secondsElapsed)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[typography.caption, { color: palette.navy, fontWeight: '600' }]}>
            {currentIndex + 1} / {totalQuestions}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progressPercent} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Question Type & Eyebrow */}
        <View style={styles.questionEyebrow}>
          <Text style={[typography.caption, { color: palette.orange, fontWeight: '700' }]}>
            {currentQuestion?.type === 'multi'
              ? 'MULTIPLE CHOICE · SELECT ALL THAT APPLY'
              : currentQuestion?.type === 'true_false'
                ? 'TRUE OR FALSE'
                : 'SINGLE CHOICE'}
          </Text>
        </View>

        {/* Question Text */}
        <Text style={[typography.title2, styles.questionText, { color: palette.navy }]}>
          {currentQuestion?.text}
        </Text>

        {/* Option Cards */}
        <View style={styles.optionsList}>
          {currentQuestion?.options.map((option) => {
            const isSelected = currentSelectedOptions.includes(option.id);

            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.8}
                onPress={() => handleSelectOption(option.id)}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              >
                <View
                  style={[
                    styles.radioCircle,
                    currentQuestion.type === 'multi' && styles.checkboxSquare,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInnerDot,
                        currentQuestion.type === 'multi' && styles.checkSquareInner,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    typography.body,
                    styles.optionText,
                    isSelected
                      ? { color: palette.navy, fontWeight: '600' }
                      : { color: palette.mutedOnLight },
                  ]}
                >
                  {option.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Sticky Footer */}
      <View
        style={[styles.footerBar, { borderColor: palette.line, backgroundColor: palette.white }]}
      >
        <Button
          variant="ghost"
          size="md"
          disabled={currentIndex === 0}
          onPress={handlePrevious}
          style={styles.navButton}
        >
          <ArrowLeft size={16} color={currentIndex === 0 ? palette.line : palette.navy} />
          <Text
            style={[
              typography.caption,
              { color: currentIndex === 0 ? palette.line : palette.navy, marginLeft: spacing.xs },
            ]}
          >
            Prev
          </Text>
        </Button>

        {isLastQuestion ? (
          <Button
            variant="primary"
            size="md"
            pill
            disabled={!isAnswerSelected || submitting}
            loading={submitting}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Submit Drill
          </Button>
        ) : (
          <Button
            variant="dark"
            size="md"
            pill
            disabled={!isAnswerSelected}
            onPress={handleNext}
            style={styles.nextButton}
          >
            <Text style={[typography.caption, { color: palette.cream, marginRight: spacing.xs }]}>
              Next
            </Text>
            <ArrowRight size={16} color={palette.cream} />
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  exitButton: {
    padding: spacing.xs,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  headerRight: {
    padding: spacing.xs,
  },
  progressContainer: {
    width: '100%',
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  questionEyebrow: {
    marginBottom: spacing.xs,
  },
  questionText: {
    marginBottom: spacing.xl,
    lineHeight: 28,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  optionCardSelected: {
    borderColor: palette.navy,
    backgroundColor: palette.cream,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxSquare: {
    borderRadius: radius.xs,
  },
  radioCircleSelected: {
    borderColor: palette.navy,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.navy,
  },
  checkSquareInner: {
    borderRadius: 2,
  },
  optionText: {
    flex: 1,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButton: {
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    minWidth: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
});
