import { api } from './api-client';
import type {
  HomeDashboardResponse,
  DailyPlan,
  DailyPlanItem,
  VisionBoardItem,
  CreateVisionBoardItemDto,
  UpdateVisionBoardItemDto,
} from '@sofe/shared';

export interface ToggleTaskResponse {
  success: boolean;
  item: DailyPlanItem;
  completedCount: number;
}

export const homeApi = {
  getHomeDashboard: (tz?: string): Promise<HomeDashboardResponse> => {
    const params = tz ? { tz } : undefined;
    return api.get<HomeDashboardResponse>('/home', { params });
  },

  getDailyPlan: (tz?: string): Promise<DailyPlan> => {
    const params = tz ? { tz } : undefined;
    return api.get<DailyPlan>('/home/plan', { params });
  },

  toggleDailyTask: (taskId: string, done: boolean, tz?: string): Promise<ToggleTaskResponse> => {
    const params = tz ? { tz } : undefined;
    return api.post<ToggleTaskResponse>(
      `/home/plan/tasks/${encodeURIComponent(taskId)}`,
      { done },
      { params },
    );
  },

  getVisionBoard: (): Promise<VisionBoardItem[]> => {
    return api.get<VisionBoardItem[]>('/home/vision-board');
  },

  createVisionBoardItem: (dto: CreateVisionBoardItemDto): Promise<VisionBoardItem> => {
    return api.post<VisionBoardItem>('/home/vision-board', dto);
  },

  updateVisionBoardItem: (id: string, dto: UpdateVisionBoardItemDto): Promise<VisionBoardItem> => {
    return api.patch<VisionBoardItem>(`/home/vision-board/${encodeURIComponent(id)}`, dto);
  },

  deleteVisionBoardItem: (id: string): Promise<{ success: boolean }> => {
    return api.del<{ success: boolean }>(`/home/vision-board/${encodeURIComponent(id)}`);
  },

  reorderVisionBoardItems: (itemIds: string[]): Promise<{ success: boolean }> => {
    return api.put<{ success: boolean }>('/home/vision-board/reorder', {
      itemIds,
    });
  },

  getQuotes: (): Promise<unknown[]> => {
    return api.get<unknown[]>('/home/quotes');
  },

  getWords: (): Promise<unknown[]> => {
    return api.get<unknown[]>('/home/words');
  },
};
