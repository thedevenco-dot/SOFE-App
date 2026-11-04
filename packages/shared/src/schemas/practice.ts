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

// ==========================================
// Admin Practice, Scheduler & Rewards (T3.5)
// ==========================================

import { REWARD_TYPES, type RewardType } from '../enums/practice';

export const createAdminQuizSchema = z.object({
  title: z.string().min(1),
  kind: quizKindSchema,
  lessonId: z.string().optional(),
  topicId: z.string().optional(),
  passingScorePercent: z.number().int().min(0).max(100).default(80),
  questions: z.array(quizQuestionSchema).min(1),
  status: z.enum(['draft', 'published']).default('draft'),
  order: z.number().int().optional(),
});
export type CreateAdminQuizDto = z.infer<typeof createAdminQuizSchema>;

export const updateAdminQuizSchema = createAdminQuizSchema.partial();
export type UpdateAdminQuizDto = z.infer<typeof updateAdminQuizSchema>;

export const csvQuizImportRowSchema = z.object({
  quiz_title: z.string().min(1),
  question: z.string().min(1),
  type: z.enum(['single', 'multi', 'true_false']),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().optional(),
  option_d: z.string().optional(),
  option_e: z.string().optional(),
  option_f: z.string().optional(),
  correct: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().optional(),
});
export type CsvQuizImportRow = z.infer<typeof csvQuizImportRowSchema>;

export const csvImportDryRunResponseSchema = z.object({
  totalRows: z.number().int(),
  validRows: z.number().int(),
  errorRows: z.number().int(),
  quizzesDetected: z.number().int(),
  errors: z.array(
    z.object({
      row: z.number().int(),
      field: z.string(),
      message: z.string(),
    }),
  ),
  preview: z.array(
    z.object({
      quizTitle: z.string(),
      questionText: z.string(),
      type: z.string(),
      optionsCount: z.number().int(),
      correctCount: z.number().int(),
    }),
  ),
});
export type CsvImportDryRunResponse = z.infer<typeof csvImportDryRunResponseSchema>;

export const globalPracticeScheduleSchema = z.object({
  id: z.string().min(1),
  dateKey: dateKeySchema,
  slots: z.array(practiceSlotSchema),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type GlobalPracticeScheduleDto = z.infer<typeof globalPracticeScheduleSchema>;

export const updateScheduleDateSchema = z.object({
  slots: z.array(practiceSlotSchema),
});
export type UpdateScheduleDateDto = z.infer<typeof updateScheduleDateSchema>;

export const copyWeekScheduleSchema = z.object({
  sourceFromDateKey: dateKeySchema,
  targetFromDateKey: dateKeySchema,
});
export type CopyWeekScheduleDto = z.infer<typeof copyWeekScheduleSchema>;

export const pointsRulesSchema = z.object({
  quizPoints: z.number().int().nonnegative().default(50),
  lessonPoints: z.number().int().nonnegative().default(25),
  dailyStreakBonus: z.number().int().nonnegative().default(50),
  maxDailyPoints: z.number().int().nonnegative().default(500),
  freeCourseCost: z.number().int().nonnegative().default(500),
});
export type PointsRulesDto = z.infer<typeof pointsRulesSchema>;

export const adminAdjustPointsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int(),
  reason: z.string().default('admin_adjust'),
  note: z.string().min(1),
});
export type AdminAdjustPointsDto = z.infer<typeof adminAdjustPointsSchema>;

export const rewardTypeSchema = z.enum(
  Object.values(REWARD_TYPES) as [RewardType, ...RewardType[]],
);

export const rewardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: rewardTypeSchema,
  costPoints: z.number().int().min(1),
  courseId: z.string().optional(),
  couponCode: z.string().optional(),
  stock: z.number().int().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type RewardDto = z.infer<typeof rewardSchema>;

export const createRewardSchema = rewardSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateRewardDto = z.infer<typeof createRewardSchema>;

export const updateRewardSchema = createRewardSchema.partial();
export type UpdateRewardDto = z.infer<typeof updateRewardSchema>;

export const reflectionPromptSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  category: z.string().optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ReflectionPromptDto = z.infer<typeof reflectionPromptSchema>;

export const createReflectionPromptSchema = reflectionPromptSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateReflectionPromptDto = z.infer<typeof createReflectionPromptSchema>;

export const updateReflectionPromptSchema = createReflectionPromptSchema.partial();
export type UpdateReflectionPromptDto = z.infer<typeof updateReflectionPromptSchema>;

// ==========================================
// Reward Redemption Schemas (Task T3.7)
// ==========================================

export const redeemRewardSchema = z.object({
  idempotencyKey: z.string().optional(),
});
export type RedeemRewardDto = z.infer<typeof redeemRewardSchema>;

export const rewardRedemptionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  rewardId: z.string().min(1),
  costPoints: z.number().int().min(1),
  ledgerId: z.string().min(1),
  enrollmentId: z.string().optional(),
  status: z.enum(['completed', 'reversed']),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type RewardRedemptionDto = z.infer<typeof rewardRedemptionSchema>;

export const rewardRedemptionResponseSchema = z.object({
  success: z.boolean(),
  idempotent: z.boolean().optional(),
  message: z.string().optional(),
  redemption: z.object({
    id: z.string(),
    userId: z.string(),
    rewardId: z.string(),
    costPoints: z.number(),
    ledgerId: z.string(),
    enrollmentId: z.string().optional(),
    status: z.string(),
    idempotencyKey: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.string().optional(),
  }),
  enrollment: z
    .object({
      id: z.string(),
      courseId: z.string(),
    })
    .optional(),
  remainingBalance: z.number().int(),
});
export type RewardRedemptionResponseDto = z.infer<typeof rewardRedemptionResponseSchema>;
