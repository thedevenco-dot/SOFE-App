import { notificationsApi } from './notifications-api';
import { api } from './api-client';

jest.mock('./api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  },
}));

describe('notificationsApi (Task T3.10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getNotifications', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      unreadCount: 0,
    });
    const res = await notificationsApi.getNotifications({ page: 1, limit: 10 });
    expect(api.get).toHaveBeenCalledWith('/notifications', {
      params: { page: 1, limit: 10, unreadOnly: false },
    });
    expect(res.total).toBe(0);
  });

  it('calls getUnreadCount', async () => {
    (api.get as jest.Mock).mockResolvedValue({ unreadCount: 5 });
    const res = await notificationsApi.getUnreadCount();
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(res.unreadCount).toBe(5);
  });

  it('calls markRead', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ success: true, modifiedCount: 2 });
    const res = await notificationsApi.markRead({ ids: ['n1', 'n2'] });
    expect(api.patch).toHaveBeenCalledWith('/notifications/mark-read', { ids: ['n1', 'n2'] });
    expect(res.modifiedCount).toBe(2);
  });

  it('calls registerPushToken', async () => {
    (api.post as jest.Mock).mockResolvedValue({ success: true });
    const res = await notificationsApi.registerPushToken({
      token: 'ExponentPushToken[xyz123]',
      platform: 'ios',
    });
    expect(api.post).toHaveBeenCalledWith('/notifications/push-token', {
      token: 'ExponentPushToken[xyz123]',
      platform: 'ios',
    });
    expect(res.success).toBe(true);
  });

  it('calls deregisterPushToken', async () => {
    (api.del as jest.Mock).mockResolvedValue({ success: true });
    const res = await notificationsApi.deregisterPushToken({
      token: 'ExponentPushToken[xyz123]',
    });
    expect(api.del).toHaveBeenCalledWith('/notifications/push-token', {
      body: { token: 'ExponentPushToken[xyz123]' },
    });
    expect(res.success).toBe(true);
  });
});
