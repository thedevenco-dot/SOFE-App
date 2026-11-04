import { api } from './api-client';
import type {
  NotificationItemDto,
  NotificationQueryDto,
  MarkNotificationsReadDto,
  PushTokenDto,
  DeletePushTokenDto,
} from '@sofe/shared';

export interface NotificationsListResponse {
  items: NotificationItemDto[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  success: boolean;
  modifiedCount: number;
}

export interface PushTokenResponse {
  success: boolean;
}

export const notificationsApi = {
  getNotifications: (query?: NotificationQueryDto): Promise<NotificationsListResponse> => {
    return api.get<NotificationsListResponse>('/notifications', {
      params: {
        page: query?.page ?? 1,
        limit: query?.limit ?? 20,
        unreadOnly: query?.unreadOnly ?? false,
      },
    });
  },

  getUnreadCount: (): Promise<UnreadCountResponse> => {
    return api.get<UnreadCountResponse>('/notifications/unread-count');
  },

  markRead: (dto: MarkNotificationsReadDto): Promise<MarkReadResponse> => {
    return api.patch<MarkReadResponse>('/notifications/mark-read', dto);
  },

  registerPushToken: (dto: PushTokenDto): Promise<PushTokenResponse> => {
    return api.post<PushTokenResponse>('/notifications/push-token', dto);
  },

  deregisterPushToken: (dto: DeletePushTokenDto): Promise<PushTokenResponse> => {
    return api.del<PushTokenResponse>('/notifications/push-token', {
      body: dto,
    });
  },
};
