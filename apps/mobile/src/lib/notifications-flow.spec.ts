import { notificationsApi } from './notifications-api';
import { profileApi } from './profile-api';
import { api } from './api-client';
import { handleDeepLink } from './deep-links';

jest.mock('./api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  },
}));

describe('Notifications & Deep Link Flow Integration (Task T3.10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HM7 Notification Centre Flow', () => {
    it('retrieves notifications inbox with unread count', async () => {
      const mockList = {
        items: [
          {
            id: 'n_streak_1',
            userId: 'user_1',
            type: 'streak_reminder',
            title: "Don't break your 5-day streak!",
            body: 'Complete today’s 3-minute quiz to keep momentum.',
            data: { deepLink: 'sofe://practise/daily' },
            readAt: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'n_points_2',
            userId: 'user_1',
            type: 'points_earned',
            title: '+25 Points Earned',
            body: 'You crushed the Founders Unit Economics drill.',
            data: { deepLink: 'sofe://practise/points', points: 25 },
            readAt: '2026-11-03T10:00:00.000Z',
            createdAt: '2026-11-03T10:00:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        unreadCount: 1,
      };

      (api.get as jest.Mock).mockResolvedValue(mockList);

      const res = await notificationsApi.getNotifications({ page: 1 });
      expect(res.unreadCount).toBe(1);
      expect(res.items.length).toBe(2);
      expect(res.items[0].type).toBe('streak_reminder');
    });

    it('marks all notifications as read', async () => {
      (api.patch as jest.Mock).mockResolvedValue({ success: true, modifiedCount: 3 });

      const res = await notificationsApi.markRead({ all: true });
      expect(api.patch).toHaveBeenCalledWith('/notifications/mark-read', { all: true });
      expect(res.modifiedCount).toBe(3);
    });

    it('marks individual notification as read and resolves deep link', async () => {
      (api.patch as jest.Mock).mockResolvedValue({ success: true, modifiedCount: 1 });

      await notificationsApi.markRead({ ids: ['n_streak_1'] });
      expect(api.patch).toHaveBeenCalledWith('/notifications/mark-read', { ids: ['n_streak_1'] });

      const mockRouter = { push: jest.fn() };
      const handled = handleDeepLink('sofe://practise/daily', mockRouter);
      expect(handled).toBe(true);
      expect(mockRouter.push).toHaveBeenCalledWith('/practise/daily');
    });
  });

  describe('PF13 Notification Settings Flow', () => {
    it('updates notification toggles and reminder time via updateMyProfile', async () => {
      (api.patch as jest.Mock).mockResolvedValue({
        id: 'u_1',
        settings: {
          notifications: {
            streakReminder: true,
            newContent: false,
            social: true,
            marketing: false,
          },
          reminderTime: '20:00',
        },
      });

      const res = await profileApi.updateMyProfile({
        settings: {
          notifications: {
            streakReminder: true,
            newContent: false,
            social: true,
            marketing: false,
          },
          reminderTime: '20:00',
        },
      });

      expect(api.patch).toHaveBeenCalledWith('/me', {
        settings: {
          notifications: {
            streakReminder: true,
            newContent: false,
            social: true,
            marketing: false,
          },
          reminderTime: '20:00',
        },
      });
      expect(res.id).toBe('u_1');
    });
  });
});
