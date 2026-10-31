export const COURSE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type CourseLevel = (typeof COURSE_LEVELS)[keyof typeof COURSE_LEVELS];

export const COURSE_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type CourseStatus = (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES];

export const LESSON_TYPES = {
  VIDEO: 'video',
  READING: 'reading',
  QUIZ: 'quiz',
  RESOURCE: 'resource',
} as const;

export type LessonType = (typeof LESSON_TYPES)[keyof typeof LESSON_TYPES];

export const LESSON_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type LessonStatus = (typeof LESSON_STATUSES)[keyof typeof LESSON_STATUSES];

export const MUX_ASSET_STATUSES = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERRORED: 'errored',
} as const;

export type MuxAssetStatus = (typeof MUX_ASSET_STATUSES)[keyof typeof MUX_ASSET_STATUSES];

export const RESOURCE_KINDS = {
  PDF: 'pdf',
  LINK: 'link',
  FILE: 'file',
} as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[keyof typeof RESOURCE_KINDS];

export const ENROLLMENT_SOURCES = {
  PURCHASE: 'purchase',
  POINTS: 'points',
  ADMIN: 'admin',
  FREE: 'free',
} as const;

export type EnrollmentSource = (typeof ENROLLMENT_SOURCES)[keyof typeof ENROLLMENT_SOURCES];

export const ENROLLMENT_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  REVOKED: 'revoked',
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

export const LESSON_PROGRESS_STATUSES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type LessonProgressStatus =
  (typeof LESSON_PROGRESS_STATUSES)[keyof typeof LESSON_PROGRESS_STATUSES];

export const COURSE_REVIEW_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type CourseReviewStatus =
  (typeof COURSE_REVIEW_STATUSES)[keyof typeof COURSE_REVIEW_STATUSES];

export const BOOK_FORMATS = {
  PDF: 'pdf',
  SUMMARY: 'summary',
} as const;

export type BookFormat = (typeof BOOK_FORMATS)[keyof typeof BOOK_FORMATS];

export const BOOKMARK_TARGET_TYPES = {
  ARTICLE: 'article',
  COURSE: 'course',
  BOOK: 'book',
  VIDEO: 'video',
  POST: 'post',
} as const;

export type BookmarkTargetType = (typeof BOOKMARK_TARGET_TYPES)[keyof typeof BOOKMARK_TARGET_TYPES];

export const ARTICLE_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[keyof typeof ARTICLE_STATUSES];
