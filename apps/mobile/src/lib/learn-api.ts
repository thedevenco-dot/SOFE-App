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
