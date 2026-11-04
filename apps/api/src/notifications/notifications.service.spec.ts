import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { ExpoPushService } from './expo-push.service';
import { Notification } from '../database/schemas/notification.schema';
import { PushCampaign, PushCampaignDocument } from '../database/schemas/push-campaign.schema';
import { User } from '../database/schemas/user.schema';
import { Enrollment } from '../database/schemas/enrollment.schema';

describe('NotificationsService (Task T3.10)', () => {
  let service: NotificationsService;
  let mockNotificationModel: Record<string, jest.Mock>;
  let mockPushCampaignModel: Record<string, jest.Mock>;
  let mockUserModel: Record<string, jest.Mock>;
  let mockEnrollmentModel: Record<string, jest.Mock>;
  let mockExpoPushService: {
    sendPushNotifications: jest.Mock;
    isExpoPushToken: jest.Mock;
  };

  const validUserId = new Types.ObjectId().toString();
  const validAdminId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockNotificationModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      insertMany: jest.fn(),
    };

    mockPushCampaignModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    mockUserModel = {
      find: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
    };

    mockEnrollmentModel = {
      find: jest.fn(),
    };

    mockExpoPushService = {
      sendPushNotifications: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        invalidTokens: [],
      }),
      isExpoPushToken: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(PushCampaign.name),
          useValue: mockPushCampaignModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModel,
        },
        {
          provide: ExpoPushService,
          useValue: mockExpoPushService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('list', () => {
    it('returns notifications and unread count for user', async () => {
      const mockItems = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(validUserId),
          type: 'streak_reminder',
          title: 'Keep streak',
          body: 'Practice today',
          data: {},
          readAt: null,
          createdAt: new Date(),
        },
      ];

      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockItems),
      };

      mockNotificationModel.find.mockReturnValue(chain);
      mockNotificationModel.countDocuments
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await service.list(validUserId, { page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.total).toBe(1);
      expect(res.unreadCount).toBe(1);
    });
  });

  describe('markRead', () => {
    it('marks all as read when all flag is true', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const res = await service.markRead(validUserId, { all: true });
      expect(res.success).toBe(true);
      expect(res.count).toBe(3);
      expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
        { userId: new Types.ObjectId(validUserId), readAt: null },
        { $set: { readAt: expect.any(Date) } },
      );
    });

    it('marks specific IDs as read', async () => {
      const id1 = new Types.ObjectId().toString();
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const res = await service.markRead(validUserId, { ids: [id1] });
      expect(res.success).toBe(true);
      expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
        {
          userId: new Types.ObjectId(validUserId),
          readAt: null,
          _id: { $in: [new Types.ObjectId(id1)] },
        },
        { $set: { readAt: expect.any(Date) } },
      );
    });
  });

  describe('push tokens', () => {
    it('registers push token and removes old entry', async () => {
      mockUserModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const res = await service.registerPushToken(validUserId, {
        token: 'ExponentPushToken[abc1234567890]',
        platform: 'ios',
      });

      expect(res.success).toBe(true);
      expect(mockUserModel.updateOne).toHaveBeenCalledTimes(2);
    });

    it('deregisters push token', async () => {
      mockUserModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const res = await service.deregisterPushToken(
        validUserId,
        'ExponentPushToken[abc1234567890]',
      );
      expect(res.success).toBe(true);
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(validUserId) },
        { $pull: { pushTokens: { token: 'ExponentPushToken[abc1234567890]' } } },
      );
    });
  });

  describe('sendToUser', () => {
    it('creates notification and sends push if allowed by settings', async () => {
      mockNotificationModel.create.mockResolvedValue({ id: 'notif_1' });
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(validUserId),
          settings: { notifications: { streakReminder: true } },
          pushTokens: [{ token: 'ExponentPushToken[test]' }],
        }),
      });

      await service.sendToUser(validUserId, {
        type: 'streak_reminder',
        title: 'Streak!',
        body: 'Do not forget',
      });

      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockExpoPushService.sendPushNotifications).toHaveBeenCalledWith([
        expect.objectContaining({ to: 'ExponentPushToken[test]' }),
      ]);
    });

    it('skips push if user disabled streak reminders in settings', async () => {
      mockNotificationModel.create.mockResolvedValue({ id: 'notif_1' });
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(validUserId),
          settings: { notifications: { streakReminder: false } },
          pushTokens: [{ token: 'ExponentPushToken[test]' }],
        }),
      });

      await service.sendToUser(validUserId, {
        type: 'streak_reminder',
        title: 'Streak!',
        body: 'Do not forget',
      });

      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockExpoPushService.sendPushNotifications).not.toHaveBeenCalled();
    });
  });

  describe('push campaigns (CS29)', () => {
    it('creates campaign and immediately dispatches if sendNow', async () => {
      const mockCamp = {
        _id: new Types.ObjectId(),
        title: 'Launch Event',
        body: 'Join now',
        segment: { type: 'all' },
        status: 'draft',
        save: jest.fn().mockResolvedValue(true),
      } as unknown as PushCampaignDocument;

      mockPushCampaignModel.create.mockResolvedValue(mockCamp);
      mockPushCampaignModel.findById.mockResolvedValue(mockCamp);
      mockUserModel.find.mockResolvedValue([
        {
          _id: new Types.ObjectId(validUserId),
          pushTokens: [{ token: 'ExponentPushToken[123]' }],
        },
      ]);
      mockNotificationModel.insertMany.mockResolvedValue([]);

      const res = await service.createCampaign(validAdminId, {
        title: 'Launch Event',
        body: 'Join now',
        segment: { type: 'all' },
        sendNow: true,
      });

      expect(res.title).toBe('Launch Event');
      expect(mockExpoPushService.sendPushNotifications).toHaveBeenCalled();
      expect(mockCamp.status).toBe('sent');
    });

    it('sends test push to token', async () => {
      const res = await service.sendTestPush(validAdminId, 'ExponentPushToken[test]', {
        title: 'Test',
        body: 'Test Body',
      });

      expect(res.success).toBe(true);
      expect(mockExpoPushService.sendPushNotifications).toHaveBeenCalledWith([
        expect.objectContaining({ to: 'ExponentPushToken[test]', title: 'Test' }),
      ]);
    });
  });

  describe('runStreakReminderCheck', () => {
    it('sends reminder when user reminderTime matches current hour and practice not done', async () => {
      // 09:00 UTC mock reference date
      const testDate = new Date('2026-11-04T09:30:00Z');

      mockUserModel.find.mockResolvedValue([
        {
          _id: new Types.ObjectId(validUserId),
          timezone: 'UTC',
          settings: { reminderTime: '09:00', notifications: { streakReminder: true } },
          streak: { lastActiveDateKey: '2026-11-03' },
          pushTokens: [{ token: 'ExponentPushToken[u1]' }],
        },
      ]);
      mockNotificationModel.create.mockResolvedValue({ id: 'n1' });
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(validUserId),
          settings: { notifications: { streakReminder: true } },
          pushTokens: [{ token: 'ExponentPushToken[u1]' }],
        }),
      });

      const count = await service.runStreakReminderCheck(testDate);
      expect(count).toBe(1);
    });
  });
});
