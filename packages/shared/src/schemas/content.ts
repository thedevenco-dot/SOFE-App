import { z } from 'zod';
import {
  COURSE_LEVELS,
  COURSE_STATUSES,
  LESSON_TYPES,
  ARTICLE_STATUSES,
  BOOK_FORMATS,
  MUX_ASSET_STATUSES,
  RESOURCE_KINDS,
} from '../enums/content';
import { cursorPaginationQuerySchema } from './common';

export const courseLevelSchema = z.enum(Object.values(COURSE_LEVELS) as [string, ...string[]]);
export const courseStatusSchema = z.enum(Object.values(COURSE_STATUSES) as [string, ...string[]]);
export const lessonTypeSchema = z.enum(Object.values(LESSON_TYPES) as [string, ...string[]]);
export const articleStatusSchema = z.enum(Object.values(ARTICLE_STATUSES) as [string, ...string[]]);
export const bookFormatSchema = z.enum(Object.values(BOOK_FORMATS) as [string, ...string[]]);
export const muxAssetStatusSchema = z.enum(
  Object.values(MUX_ASSET_STATUSES) as [string, ...string[]],
);
export const resourceKindSchema = z.enum(Object.values(RESOURCE_KINDS) as [string, ...string[]]);

// 1. Course Categories
export const courseCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  order: z.number().int().default(0),
  iconUrl: z.string().url().optional(),
});
export type CourseCategoryDto = z.infer<typeof courseCategorySchema>;

// 2. Instructors
export const instructorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  title: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  links: z.array(z.string().url()).default([]),
  userId: z.string().optional(),
});
export type InstructorDto = z.infer<typeof instructorSchema>;

// 3. Topics (Startup World)
export const topicSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  order: z.number().int().default(0),
  isTab: z.boolean().default(false),
  description: z.string().max(500).optional(),
});
export type TopicDto = z.infer<typeof topicSchema>;

// 4. Authors (Startup World Articles)
export const authorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  title: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  userId: z.string().optional(),
});
export type AuthorDto = z.infer<typeof authorSchema>;

// 5. Lessons
export const lessonResourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  kind: resourceKindSchema,
});

export const lessonSchema = z.object({
  id: z.string().optional(),
  courseId: z.string(),
  moduleId: z.string(),
  order: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  type: lessonTypeSchema,
  isFreePreview: z.boolean().default(false),
  isRequired: z.boolean().default(true),
  status: z.enum(['draft', 'published']).default('draft'),
  durationSec: z.number().int().nonnegative().optional(),
  video: z
    .object({
      mux: z
        .object({
          assetId: z.string().optional(),
          playbackId: z.string().optional(),
          status: muxAssetStatusSchema.optional(),
        })
        .optional(),
    })
    .optional(),
  reading: z
    .object({
      bodyJson: z.record(z.unknown()).optional(),
      bodyHtml: z.string().optional(),
    })
    .optional(),
  quiz: z
    .object({
      quizId: z.string().optional(),
    })
    .optional(),
  resource: z
    .object({
      resources: z.array(lessonResourceSchema).optional(),
    })
    .optional(),
});
export type LessonDto = z.infer<typeof lessonSchema>;

export const createLessonSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  order: z.number().int().nonnegative().optional(),
  title: z.string().min(1).max(200),
  type: lessonTypeSchema,
  isFreePreview: z.boolean().default(false).optional(),
  isRequired: z.boolean().default(true).optional(),
  status: z.enum(['draft', 'published']).default('draft').optional(),
  durationSec: z.number().int().nonnegative().optional(),
  video: z
    .object({
      mux: z
        .object({
          assetId: z.string().optional(),
          playbackId: z.string().optional(),
          status: muxAssetStatusSchema.optional(),
        })
        .optional(),
    })
    .optional(),
  reading: z
    .object({
      bodyJson: z.record(z.unknown()).optional(),
      bodyHtml: z.string().optional(),
    })
    .optional(),
  quiz: z
    .object({
      quizId: z.string().optional(),
    })
    .optional(),
  resource: z
    .object({
      resources: z.array(lessonResourceSchema).optional(),
    })
    .optional(),
});
export type CreateLessonDto = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = lessonSchema.partial();
export type UpdateLessonDto = z.infer<typeof updateLessonSchema>;

// 6. Courses
export const courseModuleSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  lessonIds: z.array(z.string()).default([]),
});
export type CourseModuleDto = z.infer<typeof courseModuleSchema>;

export const updateCurriculumSchema = z.object({
  modules: z.array(courseModuleSchema),
});
export type UpdateCurriculumDto = z.infer<typeof updateCurriculumSchema>;

export const courseSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  descriptionJson: z.record(z.unknown()).optional(),
  descriptionHtml: z.string().optional(),
  thumbnailUrl: z.string().url(),
  previewMuxPlaybackId: z.string().optional(),
  categoryId: z.string(),
  tags: z.array(z.string()).default([]),
  level: courseLevelSchema.default('beginner'),
  language: z.string().default('en'),
  instructorIds: z.array(z.string()).default([]),
  priceInr: z.number().int().nonnegative().default(0),
  compareAtPriceInr: z.number().int().nonnegative().optional(),
  iapProductIds: z
    .object({
      ios: z.string().optional(),
      android: z.string().optional(),
    })
    .default({}),
  redeemableWithPoints: z.boolean().default(false),
  status: courseStatusSchema.default('draft'),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  modules: z.array(courseModuleSchema).default([]),
  stats: z
    .object({
      enrolledCount: z.number().int().nonnegative().default(0),
      ratingAvg: z.number().min(0).max(5).default(0),
      ratingCount: z.number().int().nonnegative().default(0),
      lessonCount: z.number().int().nonnegative().default(0),
      durationSec: z.number().int().nonnegative().default(0),
    })
    .default({
      enrolledCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      lessonCount: 0,
      durationSec: 0,
    }),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  version: z.number().int().default(1),
});
export type CourseDto = z.infer<typeof courseSchema>;

// 7. Articles (Startup World)
export const articleSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  bodyJson: z.record(z.unknown()).optional(),
  bodyHtml: z.string().min(1),
  coverUrl: z.string().url(),
  coverAlt: z.string().optional(),
  topicIds: z.array(z.string()).default([]),
  primaryTopicId: z.string(),
  tags: z.array(z.string()).default([]),
  authorId: z.string(),
  readTimeMin: z.number().int().positive().default(5),
  status: articleStatusSchema.default('draft'),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  featured: z.boolean().default(false),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  stats: z
    .object({
      views: z.number().int().nonnegative().default(0),
      bookmarks: z.number().int().nonnegative().default(0),
    })
    .default({ views: 0, bookmarks: 0 }),
  createdBy: z.string().optional(),
  version: z.number().int().default(1),
});
export type ArticleDto = z.infer<typeof articleSchema>;

export const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).optional(),
  excerpt: z.string().max(500).optional(),
  bodyHtml: z.string().optional(),
  bodyJson: z.record(z.unknown()).optional(),
  coverUrl: z.string().url().optional(),
  coverAlt: z.string().optional(),
  topicIds: z.array(z.string()).default([]).optional(),
  primaryTopicId: z.string().optional(),
  tags: z.array(z.string()).default([]).optional(),
  authorId: z.string().optional(),
  readTimeMin: z.number().int().positive().optional(),
  status: articleStatusSchema.default('draft').optional(),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  featured: z.boolean().default(false).optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});
export type CreateArticleDto = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(120).optional(),
  excerpt: z.string().max(500).optional(),
  bodyHtml: z.string().optional(),
  bodyJson: z.record(z.unknown()).optional(),
  coverUrl: z.string().url().optional(),
  coverAlt: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  primaryTopicId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.string().optional(),
  readTimeMin: z.number().int().positive().optional(),
  status: articleStatusSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  featured: z.boolean().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});
export type UpdateArticleDto = z.infer<typeof updateArticleSchema>;

// 8. Books
export const bookSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  coverUrl: z.string().url(),
  descriptionJson: z.record(z.unknown()).optional(),
  descriptionHtml: z.string().optional(),
  format: bookFormatSchema,
  fileUrl: z.string().url().optional(),
  summaryJson: z.record(z.unknown()).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFree: z.boolean().default(true),
  priceInr: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: z.string().datetime().optional(),
});
export type BookDto = z.infer<typeof bookSchema>;

export const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).optional(),
  author: z.string().min(1).max(100),
  coverUrl: z.string().url(),
  descriptionJson: z.record(z.unknown()).optional(),
  descriptionHtml: z.string().optional(),
  format: bookFormatSchema,
  fileUrl: z.string().url().optional(),
  summaryJson: z.record(z.unknown()).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]).optional(),
  isFree: z.boolean().default(true).optional(),
  priceInr: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft').optional(),
  publishedAt: z.string().datetime().optional(),
});
export type CreateBookDto = z.infer<typeof createBookSchema>;

export const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(120).optional(),
  author: z.string().min(1).max(100).optional(),
  coverUrl: z.string().url().optional(),
  descriptionJson: z.record(z.unknown()).optional(),
  descriptionHtml: z.string().optional(),
  format: bookFormatSchema.optional(),
  fileUrl: z.string().url().optional(),
  summaryJson: z.record(z.unknown()).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
  priceInr: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().datetime().optional(),
});
export type UpdateBookDto = z.infer<typeof updateBookSchema>;

// 9. Videos (Standalone)
export const videoItemSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  thumbnailUrl: z.string().url(),
  mux: z
    .object({
      assetId: z.string().optional(),
      playbackId: z.string().optional(),
      status: muxAssetStatusSchema.optional(),
    })
    .default({}),
  durationSec: z.number().int().nonnegative().default(0),
  topicIds: z.array(z.string()).default([]),
  isFree: z.boolean().default(true),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: z.string().datetime().optional(),
});
export type VideoItemDto = z.infer<typeof videoItemSchema>;

export const createVideoSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url(),
  mux: z
    .object({
      assetId: z.string().optional(),
      playbackId: z.string().optional(),
      status: muxAssetStatusSchema.optional(),
    })
    .default({})
    .optional(),
  durationSec: z.number().int().nonnegative().default(0).optional(),
  topicIds: z.array(z.string()).default([]).optional(),
  isFree: z.boolean().default(true).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft').optional(),
  publishedAt: z.string().datetime().optional(),
});
export type CreateVideoDto = z.infer<typeof createVideoSchema>;

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  mux: z
    .object({
      assetId: z.string().optional(),
      playbackId: z.string().optional(),
      status: muxAssetStatusSchema.optional(),
    })
    .optional(),
  durationSec: z.number().int().nonnegative().optional(),
  topicIds: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().datetime().optional(),
});
export type UpdateVideoDto = z.infer<typeof updateVideoSchema>;

// 10. Quotes
export const quoteItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1).max(500),
  author: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});
export type QuoteItemDto = z.infer<typeof quoteItemSchema>;

// 11. Words
export const wordItemSchema = z.object({
  id: z.string().optional(),
  word: z.string().min(1).max(50),
  meaning: z.string().max(300).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});
export type WordItemDto = z.infer<typeof wordItemSchema>;

// Queries and Actions
export const courseQuerySchema = cursorPaginationQuerySchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),
  level: courseLevelSchema.optional(),
  price: z.enum(['free', 'paid']).optional(),
});

export const lessonProgressUpdateSchema = z.object({
  watchedSec: z.number().int().nonnegative(),
  percent: z.number().min(0).max(100),
  completed: z.boolean(),
});

export const articleQuerySchema = cursorPaginationQuerySchema.extend({
  topic: z.string().optional(),
  q: z.string().optional(),
});

export const articleReadProgressSchema = z.object({
  percent: z.number().min(0).max(100),
});

export const createCourseReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});
