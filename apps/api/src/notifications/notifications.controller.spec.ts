import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserDocument } from '../database/schemas/user.schema';

describe('NotificationsController (Task T3.10)', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockUser = {
    _id: { toString: () => 'u_123' },
  } as unknown as UserDocument;

  beforeEach(() => {
    const mockService = {
      list: jest.fn(),
      markRead: jest.fn(),
      getUnreadCount: jest.fn(),
      registerPushToken: jest.fn(),
      deregisterPushToken: jest.fn(),
    };

    service = mockService as unknown as jest.Mocked<NotificationsService>;
    controller = new NotificationsController(service);
  });

  it('lists notifications', async () => {
    service.list.mockResolvedValue({
      items: [
        {
          id: 'n1',
          userId: 'u_123',
          type: 'streak_reminder',
          title: 'Test',
          body: 'Test body',
          data: {},
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ] as unknown as Awaited<ReturnType<NotificationsService['list']>>['items'],
      total: 1,
      unreadCount: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    });

    const res = await controller.list(mockUser, { page: 1, limit: 20 });
    expect(service.list).toHaveBeenCalledWith('u_123', { page: 1, limit: 20 });
    expect(res.data.length).toBe(1);
    expect(res.meta.unreadCount).toBe(1);
  });

  it('marks notifications as read', async () => {
    service.markRead.mockResolvedValue({ success: true, count: 2 });
    const res = await controller.markRead(mockUser, { all: true });
    expect(service.markRead).toHaveBeenCalledWith('u_123', { all: true });
    expect(res.count).toBe(2);
  });

  it('gets unread count', async () => {
    service.getUnreadCount.mockResolvedValue({ count: 5 });
    const res = await controller.getUnreadCount(mockUser);
    expect(service.getUnreadCount).toHaveBeenCalledWith('u_123');
    expect(res.data.count).toBe(5);
  });

  it('registers push token', async () => {
    service.registerPushToken.mockResolvedValue({ success: true });
    const res = await controller.registerPushToken(mockUser, {
      token: 'ExponentPushToken[1234567890]',
      platform: 'ios',
    });
    expect(service.registerPushToken).toHaveBeenCalledWith('u_123', {
      token: 'ExponentPushToken[1234567890]',
      platform: 'ios',
    });
    expect(res.success).toBe(true);
  });

  it('deregisters push token', async () => {
    service.deregisterPushToken.mockResolvedValue({ success: true });
    const res = await controller.deregisterPushToken(mockUser, {
      token: 'ExponentPushToken[1234567890]',
    });
    expect(service.deregisterPushToken).toHaveBeenCalledWith(
      'u_123',
      'ExponentPushToken[1234567890]',
    );
    expect(res.success).toBe(true);
  });
});
