import { api } from './api-client';
import type {
  UserStatsResponseDto,
  PublicProfileResponseDto,
  ProjectDto,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  PatchMeInput,
  LearnerAchievementsResponseDto,
  LearnerAchievementItemDto,
} from '@sofe/shared';

export type { LearnerAchievementItemDto };

export interface MobileProfile {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  interests?: string[];
  goals?: string[];
  pointsBalance?: number;
  streak?: {
    current: number;
    longest: number;
  };
}

export const profileApi = {
  getMyProfile: (): Promise<MobileProfile> => {
    return api.get<MobileProfile>('/me');
  },

  updateMyProfile: (data: PatchMeInput): Promise<MobileProfile> => {
    return api.patch<MobileProfile>('/me', data);
  },

  getMyStats: (): Promise<UserStatsResponseDto> => {
    return api.get<UserStatsResponseDto>('/me/stats');
  },

  getPublicProfile: (userId: string): Promise<PublicProfileResponseDto> => {
    return api.get<PublicProfileResponseDto>(`/users/${encodeURIComponent(userId)}`);
  },

  listProjects: (query?: ProjectQueryDto): Promise<ProjectDto[]> => {
    return api.get<ProjectDto[]>('/projects', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
  },

  getProject: (id: string): Promise<ProjectDto> => {
    return api.get<ProjectDto>(`/projects/${encodeURIComponent(id)}`);
  },

  createProject: (data: CreateProjectDto): Promise<ProjectDto> => {
    return api.post<ProjectDto>('/projects', data);
  },

  updateProject: (id: string, data: UpdateProjectDto): Promise<ProjectDto> => {
    return api.patch<ProjectDto>(`/projects/${encodeURIComponent(id)}`, data);
  },

  deleteProject: (id: string): Promise<{ success: boolean }> => {
    return api.del<{ success: boolean }>(`/projects/${encodeURIComponent(id)}`);
  },

  getAchievements: (): Promise<LearnerAchievementsResponseDto> => {
    return api.get<LearnerAchievementsResponseDto>('/achievements');
  },
};
