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
