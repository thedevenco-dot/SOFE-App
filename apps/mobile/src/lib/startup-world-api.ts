import { api } from './api-client';

export interface ApiTopic {
  id: string;
  name: string;
  slug: string;
  order?: number;
  isTab?: boolean;
  description?: string;
}

export interface ApiAuthor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ApiArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml?: string;
  bodyJson?: Record<string, unknown>;
  coverUrl: string;
  coverAlt?: string;
  readTimeMin: number;
  publishedAt?: string;
  featured?: boolean;
  tags?: string[];
  primaryTopicId?: ApiTopic | string;
  topicIds?: (ApiTopic | string)[];
  authorId?: ApiAuthor | string;
  stats?: {
    views?: number;
    bookmarks?: number;
  };
}

export interface ArticlesFeedResponse {
  featured: ApiArticle[];
  recent: ApiArticle[];
  topics: ApiTopic[];
}

export interface BookmarkItem {
  id: string;
  targetType: string;
  targetId: string;
  target?: ApiArticle;
  createdAt?: string;
}

export const startupWorldApi = {
  getFeed: () => api.get<ArticlesFeedResponse>('/articles/feed'),

  listArticles: (params?: { topic?: string; q?: string; cursor?: string; limit?: number }) =>
    api.get<{ data: ApiArticle[]; meta: { nextCursor: string | null; total: number } }>(
      '/articles',
      { params },
    ),

  getArticleBySlug: (slug: string) => api.get<ApiArticle>(`/articles/${slug}`),

  listTopics: (isTabOnly: boolean = false) =>
    api.get<ApiTopic[]>('/topics', { params: isTabOnly ? { isTab: true } : undefined }),

  getFollowedTopics: () => api.get<string[]>('/topics/followed'),

  followTopic: (topicId: string) => api.post<{ success: boolean }>(`/topics/${topicId}/follow`),

  unfollowTopic: (topicId: string) => api.del<{ success: boolean }>(`/topics/${topicId}/follow`),

  getAuthorById: (id: string) => api.get<ApiAuthor>(`/authors/${id}`),

  listBookmarks: (targetType: string = 'article') =>
    api.get<BookmarkItem[]>('/bookmarks', { params: { targetType } }),

  saveBookmark: (targetType: string, targetId: string) =>
    api.post<{ id: string; targetType: string; targetId: string }>('/bookmarks', {
      targetType,
      targetId,
    }),

  removeBookmark: (targetId: string, targetType: string = 'article') =>
    api.del<{ success: boolean }>(`/bookmarks/${targetId}`, { params: { targetType } }),

  search: (q: string, type?: string) =>
    api.get<{
      courses?: Record<string, unknown>[];
      articles?: ApiArticle[];
      books?: Record<string, unknown>[];
      videos?: Record<string, unknown>[];
    }>('/search', { params: { q, type } }),
};
