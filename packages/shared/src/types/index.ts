import { z } from 'zod';
import {
  apiErrorEnvelopeSchema,
  apiErrorSchema,
  cursorPaginationQuerySchema,
  paginationMetaSchema,
} from '../schemas/common';
import {
  patchMeSchema,
  pushTokenSchema,
  userSettingsSchema,
  planPreferencesSchema,
  adminVerify2faSchema,
} from '../schemas/auth';
import {
  courseQuerySchema,
  lessonProgressUpdateSchema,
  articleQuerySchema,
  articleReadProgressSchema,
  createCourseReviewSchema,
} from '../schemas/content';
import {
  submitQuizAttemptSchema,
  createReflectionSchema,
  dateRangeQuerySchema,
} from '../schemas/practice';
import {
  createOrderSchema,
  confirmIapSchema,
  validateCouponSchema,
  createLeadSchema,
} from '../schemas/commerce';

// Inferred Schema Types
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export type PatchMeInput = z.infer<typeof patchMeSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type PlanPreferencesInput = z.infer<typeof planPreferencesSchema>;
export type AdminVerify2faInput = z.infer<typeof adminVerify2faSchema>;

export type CourseQuery = z.infer<typeof courseQuerySchema>;
export type LessonProgressUpdate = z.infer<typeof lessonProgressUpdateSchema>;
export type ArticleQuery = z.infer<typeof articleQuerySchema>;
export type ArticleReadProgress = z.infer<typeof articleReadProgressSchema>;
export type CreateCourseReviewInput = z.infer<typeof createCourseReviewSchema>;

export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
export type CreateReflectionInput = z.infer<typeof createReflectionSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmIapInput = z.infer<typeof confirmIapSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

// Generic API Success Envelope
export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}
