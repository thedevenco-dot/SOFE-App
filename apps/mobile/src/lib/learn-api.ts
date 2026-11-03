import { api } from './api-client';

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  order?: number;
}

export interface ApiInstructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ApiLessonSummary {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  durationSec: number;
  order: number;
  isFreePreview: boolean;
  isRequired: boolean;
}

export interface ApiCourseModule {
  id: string;
  title: string;
  order: number;
  lessons: ApiLessonSummary[];
}

export interface ApiCourse {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  descriptionHtml?: string;
  thumbnailUrl: string;
  previewMuxPlaybackId?: string;
  categoryId?: ApiCategory | string;
  tags?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  priceInr: number;
  compareAtPriceInr?: number;
  instructors?: ApiInstructor[];
  instructorIds?: string[];
  modules?: ApiCourseModule[];
  stats?: {
    enrolledCount?: number;
    ratingAvg?: number;
    ratingCount?: number;
    lessonCount?: number;
    durationSec?: number;
  };
}

export interface ApiBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string;
  descriptionHtml?: string;
  format: 'pdf' | 'summary';
  fileUrl?: string;
  tags?: string[];
  isFree?: boolean;
  priceInr?: number;
  categoryId?: string;
}

export interface ApiVideo {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  durationSec: number;
  isFree?: boolean;
  topicIds?: string[];
  mux?: {
    assetId?: string;
    playbackId?: string;
    status?: string;
  };
}

export interface ApiEnrollmentProgress {
  completedLessonCount: number;
  percent: number;
  lastLessonId?: string;
  lastAccessedAt?: string;
}

export interface ApiEnrollment {
  id: string;
  userId: string;
  courseId: ApiCourse;
  source: string;
  status: 'active' | 'completed' | 'revoked';
  progress: ApiEnrollmentProgress;
  completedAt?: string;
}

export interface ApiEnrolledLesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'resource';
  durationSec: number;
  order: number;
  isFreePreview: boolean;
  isRequired: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  watchedSec: number;
  percent: number;
  completedAt?: string;
}

export interface ApiEnrolledModule {
  id: string;
  title: string;
  order: number;
  lessons: ApiEnrolledLesson[];
}

export interface ApiEnrolledCurriculum {
  courseId: string;
  courseTitle: string;
  modules: ApiEnrolledModule[];
}

export interface ApiCourseResource {
  lessonId: string;
  lessonTitle: string;
  title: string;
  url: string;
  kind: 'pdf' | 'link' | 'file';
}

export interface ApiLessonProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  status: 'in_progress' | 'completed';
  watchedSec: number;
  percent: number;
  quizScore?: number;
  completedAt?: string;
  lastEventAt: string;
}

export interface ApiLessonDetail {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'resource';
  order: number;
  isFreePreview: boolean;
  isRequired: boolean;
  durationSec?: number;
  video?: {
    mux?: {
      playbackId?: string;
      assetId?: string;
      status?: string;
    };
  };
  reading?: {
    bodyHtml?: string;
    bodyJson?: Record<string, unknown>;
  };
  quiz?: {
    quizId?: string;
  };
  resource?: {
    resources?: Array<{
      title: string;
      url: string;
      kind: 'pdf' | 'link' | 'file';
    }>;
  };
}

export interface ApiContinueLesson {
  courseId: string;
  lesson: ApiLessonDetail;
  progress: ApiLessonProgress | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    total: number;
  };
}

export const learnApi = {
  listCourses: (params?: {
    q?: string;
    category?: string;
    level?: string;
    price?: 'free' | 'paid';
    cursor?: string;
    limit?: number;
  }) => api.get<PaginatedResult<ApiCourse>>('/courses', { params }),

  getCategories: () => api.get<ApiCategory[]>('/courses/categories'),

  getRecommendedCourses: () => api.get<ApiCourse[]>('/courses/recommended'),

  getCourseBySlug: (slug: string) => api.get<ApiCourse>(`/courses/${slug}`),

  getMyEnrollments: () => api.get<{ data: ApiEnrollment[] }>('/enrollments'),

  getCourseCurriculum: (idOrSlug: string) =>
    api.get<{ data: ApiEnrolledCurriculum }>(`/courses/${idOrSlug}/curriculum`),

  getCourseResources: (idOrSlug: string) =>
    api.get<{ data: { courseId: string; resources: ApiCourseResource[] } }>(
      `/courses/${idOrSlug}/resources`,
    ),

  continueLearning: (courseId?: string) =>
    api.get<{ data: ApiContinueLesson | null }>('/courses/continue', {
      params: { courseId },
    }),

  enrollFreeCourse: (idOrSlug: string) =>
    api.post<{ data: ApiEnrollment }>(`/courses/${idOrSlug}/enroll`),

  getLesson: (id: string) =>
    api.get<{ data: { lesson: ApiLessonDetail; progress: ApiLessonProgress | null } }>(
      `/lessons/${id}`,
    ),

  getPlaybackToken: (id: string) =>
    api.get<{ data: { playbackToken: string; playbackId: string } }>(
      `/lessons/${id}/playback-token`,
    ),

  updateLessonProgress: (
    id: string,
    body: { watchedSec: number; percent: number; completed: boolean },
  ) =>
    api.post<{
      data: {
        progress: ApiLessonProgress;
        enrollmentProgress: ApiEnrollmentProgress | null;
        courseCompleted: boolean;
      };
    }>(`/lessons/${id}/progress`, body),

  submitLessonQuiz: (id: string, score: number) =>
    api.post<{ data: { progress: ApiLessonProgress } }>(`/lessons/${id}/quiz/submit`, { score }),

  listBooks: (params?: {
    q?: string;
    category?: string;
    format?: 'pdf' | 'summary';
    price?: 'free' | 'paid';
    cursor?: string;
    limit?: number;
  }) => api.get<PaginatedResult<ApiBook>>('/books', { params }),

  getBookBySlug: (slug: string) => api.get<ApiBook>(`/books/${slug}`),

  listVideos: (params?: {
    q?: string;
    topic?: string;
    price?: 'free' | 'paid';
    cursor?: string;
    limit?: number;
  }) => api.get<PaginatedResult<ApiVideo>>('/videos', { params }),

  getVideoBySlug: (slug: string) => api.get<ApiVideo>(`/videos/${slug}`),

  searchLearn: (q: string, type?: string) =>
    api.get<{
      courses?: ApiCourse[];
      articles?: unknown[];
      books?: ApiBook[];
      videos?: ApiVideo[];
    }>('/search', { params: { q, type } }),
};
