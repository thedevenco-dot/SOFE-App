import { api } from './api-client';
import type {
  PracticeTodayResponse,
  PublicQuizDto,
  QuizAnswerSubmission,
  QuizAttemptResultDto,
  StreakStatusDto,
  PointsLedgerEntry,
  PointsHistoryQueryDto,
  RewardDto,
} from '@sofe/shared';

export interface PracticeHistoryItem {
  id: string;
  quizId?: string;
  quizTitle: string;
  quizKind: string;
  score: number;
  passed: boolean;
  pointsAwarded: number;
  completedAt: string;
}

export interface ReflectionPromptInfo {
  id: string;
  prompt: string;
  category?: string;
  dateKey: string;
}

export interface SubmitReflectionResponse {
  success: boolean;
  pointsAwarded: number;
  done: boolean;
  dateKey: string;
}

export interface RedeemRewardResponse {
  success: boolean;
  reward: {
    id: string;
    title: string;
    type: string;
    pointsCost: number;
  };
  remainingBalance: number;
}

export interface PaginatedPointsHistory {
  entries: PointsLedgerEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export const practiseApi = {
  getTodayPractice: (tz?: string): Promise<PracticeTodayResponse> => {
    const params = tz ? { tz } : undefined;
    return api.get<PracticeTodayResponse>('/practise/today', { params });
  },

  getPracticeHistory: (limit = 20): Promise<PracticeHistoryItem[]> => {
    return api.get<PracticeHistoryItem[]>('/practise/history', {
      params: { limit },
    });
  },

  getPublicQuiz: (quizId: string): Promise<PublicQuizDto> => {
    return api.get<PublicQuizDto>(`/quizzes/${encodeURIComponent(quizId)}`);
  },

  submitQuiz: (
    quizId: string,
    answers: QuizAnswerSubmission[],
    tz?: string,
  ): Promise<QuizAttemptResultDto> => {
    const params = tz ? { tz } : undefined;
    return api.post<QuizAttemptResultDto>(
      `/quizzes/${encodeURIComponent(quizId)}/submit`,
      { answers },
      { params },
    );
  },

  getTodayReflection: (tz?: string): Promise<ReflectionPromptInfo> => {
    const params = tz ? { tz } : undefined;
    return api.get<ReflectionPromptInfo>('/practise/reflection/today', { params });
  },

  submitReflection: (
    dto: { responseText: string; promptId?: string },
    tz?: string,
  ): Promise<SubmitReflectionResponse> => {
    const params = tz ? { tz } : undefined;
    return api.post<SubmitReflectionResponse>('/practise/reflection', dto, { params });
  },

  getStreakStatus: (tz?: string): Promise<StreakStatusDto> => {
    const params = tz ? { tz } : undefined;
    return api.get<StreakStatusDto>('/streak/status', { params });
  },

  getPointsBalance: async (): Promise<{ pointsBalance: number; balance: number }> => {
    const res = await api.get<{ pointsBalance?: number; balance?: number }>('/points/balance');
    const val = res.pointsBalance ?? res.balance ?? 0;
    return { pointsBalance: val, balance: val };
  },

  getPointsHistory: (query?: PointsHistoryQueryDto): Promise<PaginatedPointsHistory> => {
    return api.get<PaginatedPointsHistory>('/points/history', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
  },

  getRewards: (): Promise<RewardDto[]> => {
    return api.get<RewardDto[]>('/practise/rewards');
  },

  redeemReward: (rewardId: string): Promise<RedeemRewardResponse> => {
    return api.post<RedeemRewardResponse>(
      `/practise/rewards/${encodeURIComponent(rewardId)}/redeem`,
    );
  },
};
