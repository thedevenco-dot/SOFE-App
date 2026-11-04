import { z } from 'zod';
import {
  PROJECT_STATUSES,
  VISIBILITIES,
  type ProjectStatus,
  type Visibility,
} from '../enums/community';

export const projectFileSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  size: z.number().int().nonnegative(),
});
export type ProjectFileDto = z.infer<typeof projectFileSchema>;

export const projectStatusSchema = z.enum(
  Object.values(PROJECT_STATUSES) as [ProjectStatus, ...ProjectStatus[]],
);

export const projectVisibilitySchema = z.enum(
  Object.values(VISIBILITIES) as [Visibility, ...Visibility[]],
);

export const projectSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
  status: projectStatusSchema.default('draft'),
  coverUrl: z.string().optional(),
  files: z.array(projectFileSchema).default([]),
  links: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  visibility: projectVisibilitySchema.default('public'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ProjectDto = z.infer<typeof projectSchema>;

export const createProjectSchema = projectSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

export const projectQuerySchema = z.object({
  status: projectStatusSchema.optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
});
export type ProjectQueryDto = z.infer<typeof projectQuerySchema>;

// ==========================================
// User Learning Stats Schemas (PF1 / PF5)
// ==========================================

export const dailyLearningChartItemSchema = z.object({
  dateKey: z.string(),
  minutes: z.number().nonnegative(),
  dayLabel: z.string(),
});
export type DailyLearningChartItemDto = z.infer<typeof dailyLearningChartItemSchema>;

export const userStatsResponseSchema = z.object({
  progressRing: z.object({
    percent: z.number().min(0).max(100),
    completedCourses: z.number().int().nonnegative(),
    totalCourses: z.number().int().nonnegative(),
    hoursWatched: z.number().nonnegative(),
  }),
  learningTimeChart: z.array(dailyLearningChartItemSchema),
  practiceStats: z.object({
    currentStreak: z.number().int().nonnegative(),
    longestStreak: z.number().int().nonnegative(),
    quizzesCompleted: z.number().int().nonnegative(),
    avgScorePercent: z.number().min(0).max(100),
    totalPoints: z.number().int().nonnegative(),
  }),
  achievementsSummary: z.object({
    totalCount: z.number().int().nonnegative(),
    unlockedCount: z.number().int().nonnegative(),
    latestUnlocked: z.array(z.string()),
  }),
});
export type UserStatsResponseDto = z.infer<typeof userStatsResponseSchema>;

// ==========================================
// Public Founder Profile Schema (PF1)
// ==========================================

export const publicProfileResponseSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  counters: z.object({
    followers: z.number().int().nonnegative(),
    following: z.number().int().nonnegative(),
    posts: z.number().int().nonnegative(),
    projects: z.number().int().nonnegative(),
  }),
  streak: z
    .object({
      current: z.number().int().nonnegative(),
      longest: z.number().int().nonnegative(),
    })
    .optional(),
  projects: z.array(projectSchema).optional(),
  achievements: z.array(z.unknown()).optional(),
});
export type PublicProfileResponseDto = z.infer<typeof publicProfileResponseSchema>;
