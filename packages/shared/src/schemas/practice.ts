import { z } from 'zod';
import { dateKeySchema } from './common';
import { POINTS_LEDGER_REASONS, type PointsLedgerReason } from '../enums/practice';

export const quizAnswerSubmissionSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string().min(1)).min(1),
});

export const submitQuizAttemptSchema = z.object({
  answers: z.array(quizAnswerSubmissionSchema),
});

export type QuizAnswerSubmission = z.infer<typeof quizAnswerSubmissionSchema>;
export type SubmitQuizAttemptDto = z.infer<typeof submitQuizAttemptSchema>;

export const createReflectionSchema = z.object({
  text: z.string().min(1).max(2000),
  promptId: z.string().optional(),
});

export const dateRangeQuerySchema = z.object({
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
});

// ==========================================
// Points Ledger & Streak Schemas (Task T3.3)
// ==========================================

export const pointsLedgerReasonSchema = z.enum(
  Object.values(POINTS_LEDGER_REASONS) as [PointsLedgerReason, ...PointsLedgerReason[]],
);

export const pointsLedgerEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().int(),
  balanceAfter: z.number().int().nonnegative(),
  reason: pointsLedgerReasonSchema,
  refType: z.string().optional(),
  refId: z.string().optional(),
  idempotencyKey: z.string().min(1),
  note: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export type PointsLedgerEntry = z.infer<typeof pointsLedgerEntrySchema>;

export const pointsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  reason: pointsLedgerReasonSchema.optional(),
});

export type PointsHistoryQueryDto = z.infer<typeof pointsHistoryQuerySchema>;

export const awardPointsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int(),
  reason: pointsLedgerReasonSchema,
  idempotencyKey: z.string().min(1),
  refType: z.string().optional(),
  refId: z.string().optional(),
  note: z.string().optional(),
});

export type AwardPointsDto = z.infer<typeof awardPointsSchema>;

export const streakDaySchema = z.object({
  id: z.string().min(1).optional(),
  userId: z.string().min(1),
  dateKey: dateKeySchema,
  activityCount: z.number().int().nonnegative(),
  completedTasksCount: z.number().int().nonnegative().default(0),
  pointsEarned: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime().optional(),
});

export type StreakDayDto = z.infer<typeof streakDaySchema>;

export const streakStatusSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  lastActiveDateKey: dateKeySchema.optional(),
  isActiveToday: z.boolean(),
  todayDateKey: dateKeySchema,
  recentDays: z.array(
    z.object({
      dateKey: dateKeySchema,
      activityCount: z.number().int().nonnegative(),
      completedTasksCount: z.number().int().nonnegative(),
      pointsEarned: z.number().int().nonnegative(),
    }),
  ),
});

export type StreakStatusDto = z.infer<typeof streakStatusSchema>;

// ==========================================
// Quiz & Practice Schemas (Task T3.4)
// ==========================================

import {
  QUIZ_KINDS,
  type QuizKind,
  QUESTION_TYPES,
  type QuestionType,
  PRACTICE_SLOT_KEYS,
  type PracticeSlotKey,
  PRACTICE_REF_TYPES,
  type PracticeRefType,
} from '../enums/practice';

export const quizKindSchema = z.enum(Object.values(QUIZ_KINDS) as [QuizKind, ...QuizKind[]]);

export const questionTypeSchema = z.enum(
  Object.values(QUESTION_TYPES) as [QuestionType, ...QuestionType[]],
);

export const practiceSlotKeySchema = z.enum(
  Object.values(PRACTICE_SLOT_KEYS) as [PracticeSlotKey, ...PracticeSlotKey[]],
);

export const practiceRefTypeSchema = z.enum(
  Object.values(PRACTICE_REF_TYPES) as [PracticeRefType, ...PracticeRefType[]],
);

export const quizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
});

export type QuizOption = z.infer<typeof quizOptionSchema>;

export const publicQuizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export type PublicQuizOption = z.infer<typeof publicQuizOptionSchema>;

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: questionTypeSchema,
  options: z.array(quizOptionSchema).min(2),
  points: z.number().int().nonnegative().optional().default(10),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const publicQuizQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: questionTypeSchema,
  options: z.array(publicQuizOptionSchema).min(2),
});

export type PublicQuizQuestion = z.infer<typeof publicQuizQuestionSchema>;

export const quizSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: quizKindSchema,
  lessonId: z.string().optional(),
  topicId: z.string().optional(),
  passingScorePercent: z.number().int().min(0).max(100).default(80),
  questions: z.array(quizQuestionSchema).min(1),
  status: z.enum(['draft', 'published']).default('published'),
  order: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type QuizDto = z.infer<typeof quizSchema>;

export const publicQuizSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: quizKindSchema,
  passingScorePercent: z.number().int(),
  questionCount: z.number().int(),
  questions: z.array(publicQuizQuestionSchema),
});

export type PublicQuizDto = z.infer<typeof publicQuizSchema>;

export const questionScoringResultSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().min(1),
  type: questionTypeSchema,
  selectedOptionIds: z.array(z.string()),
  correctOptionIds: z.array(z.string()),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
});

export type QuestionScoringResult = z.infer<typeof questionScoringResultSchema>;

export const quizAttemptResultSchema = z.object({
  attemptId: z.string().min(1),
  quizId: z.string().min(1),
  quizTitle: z.string().min(1),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  passingScorePercent: z.number().int(),
  pointsAwarded: z.number().int().nonnegative(),
  totalQuestions: z.number().int(),
  correctQuestions: z.number().int(),
  questionsResult: z.array(questionScoringResultSchema),
  completedAt: z.string().datetime(),
});

export type QuizAttemptResultDto = z.infer<typeof quizAttemptResultSchema>;

export const practiceSlotSchema = z.object({
  slotKey: practiceSlotKeySchema,
  title: z.string().min(1),
  refType: practiceRefTypeSchema,
  refId: z.string().optional(),
  done: z.boolean(),
  score: z.number().int().optional(),
});

export type PracticeSlotDto = z.infer<typeof practiceSlotSchema>;

export const practiceScheduleSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  dateKey: dateKeySchema,
  slots: z.array(practiceSlotSchema),
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});

export type PracticeScheduleDto = z.infer<typeof practiceScheduleSchema>;

export const practiceTodayResponseSchema = z.object({
  dateKey: dateKeySchema,
  schedule: practiceScheduleSchema,
  streak: z.object({
    current: z.number().int().nonnegative(),
    longest: z.number().int().nonnegative(),
    isActiveToday: z.boolean(),
  }),
  quickQuiz: publicQuizSchema.nullable(),
});

export type PracticeTodayResponse = z.infer<typeof practiceTodayResponseSchema>;
