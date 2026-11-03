import { z } from 'zod';
import { dateKeySchema } from './common';

export const dailyPlanItemKeySchema = z.enum([
  'watch_lesson',
  'complete_quiz',
  'read_article',
  'work_project',
  'reflect',
]);

export type DailyPlanItemKey = z.infer<typeof dailyPlanItemKeySchema>;

export const dailyPlanItemSchema = z.object({
  id: z.string().min(1),
  key: dailyPlanItemKeySchema,
  label: z.string().min(1),
  done: z.boolean().default(false),
  doneAt: z.string().datetime().optional().nullable(),
  refId: z.string().optional().nullable(),
});

export type DailyPlanItem = z.infer<typeof dailyPlanItemSchema>;

export const dailyPlanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  dateKey: dateKeySchema,
  items: z.array(dailyPlanItemSchema),
  completedCount: z.number().int().nonnegative(),
});

export type DailyPlan = z.infer<typeof dailyPlanSchema>;

export const toggleTaskSchema = z.object({
  done: z.boolean(),
});

export type ToggleTaskDto = z.infer<typeof toggleTaskSchema>;

export const createVisionBoardItemSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(120).optional().default(''),
  order: z.number().int().nonnegative().optional(),
});

export type CreateVisionBoardItemDto = z.infer<typeof createVisionBoardItemSchema>;

export const updateVisionBoardItemSchema = z.object({
  imageUrl: z.string().url().optional(),
  caption: z.string().max(120).optional(),
  order: z.number().int().nonnegative().optional(),
});

export type UpdateVisionBoardItemDto = z.infer<typeof updateVisionBoardItemSchema>;

export const reorderVisionBoardItemsSchema = z.object({
  itemIds: z.array(z.string().min(1)).max(12),
});

export type ReorderVisionBoardItemsDto = z.infer<typeof reorderVisionBoardItemsSchema>;

export const visionBoardItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  imageUrl: z.string().url(),
  caption: z.string().max(120).default(''),
  order: z.number().int().nonnegative(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type VisionBoardItem = z.infer<typeof visionBoardItemSchema>;

export const homeQuerySchema = z.object({
  tz: z.string().optional(),
  dateKey: dateKeySchema.optional(),
});

export type HomeQueryDto = z.infer<typeof homeQuerySchema>;

export interface HomeDashboardResponse {
  greeting: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
    cohortLabel?: string;
  };
  streak: {
    currentStreakDays: number;
    points: number;
  };
  quote: {
    id: string;
    text: string;
    author?: string;
  };
  word: {
    id: string;
    word: string;
    meaning?: string;
  };
  visionBoard: VisionBoardItem[];
  todayPlan: DailyPlan;
  continueLearning: {
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    moduleTitle?: string;
    percent: number;
    durationSec?: number;
    thumbnailUrl?: string;
  } | null;
  spotlightArticle: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverUrl: string;
    readTimeMin: number;
    topicName?: string;
  } | null;
}
