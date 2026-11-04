import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  type NotificationQueryDto,
  type MarkNotificationsReadDto,
  type CreatePushCampaignDto,
  type PushTokenDto,
} from '@sofe/shared';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from '../database/schemas/notification.schema';
import { PushCampaign, PushCampaignDocument } from '../database/schemas/push-campaign.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Enrollment, EnrollmentDocument } from '../database/schemas/enrollment.schema';
import { ExpoPushService } from './expo-push.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(PushCampaign.name)
    private readonly pushCampaignModel: Model<PushCampaignDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    private readonly expoPushService: ExpoPushService,
  ) {}

  /**
   * List in-app notifications for learner (HM7)
   */
  async list(userId: string, query: NotificationQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid userId format',
      });
    }

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.unreadOnly) {
      filter.readAt = null;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        readAt: null,
      }),
    ]);

    const formatted = items.map((n) => ({
      id: n._id.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data || {},
      readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : undefined,
    }));

    return {
      items: formatted,
      total,
      unreadCount,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Mark notifications as read (batch or all)
   */
  async markRead(userId: string, dto: MarkNotificationsReadDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid userId format',
      });
    }

    const uId = new Types.ObjectId(userId);
    const filter: Record<string, unknown> = { userId: uId, readAt: null };

    if (!dto.all && dto.ids && dto.ids.length > 0) {
      filter._id = {
        $in: dto.ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)),
      };
    }

    const result = await this.notificationModel.updateMany(filter, {
      $set: { readAt: new Date() },
    });

    return { success: true, count: result.modifiedCount };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return { count: 0 };
    }

    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      readAt: null,
    });

    return { count };
  }

  /**
   * Register Expo push token for user device
   */
  async registerPushToken(userId: string, dto: PushTokenDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid userId format',
      });
    }

    const uId = new Types.ObjectId(userId);

    // Remove existing entry for the token first to avoid duplicates
    await this.userModel.updateOne({ _id: uId }, { $pull: { pushTokens: { token: dto.token } } });

    // Add updated push token entry
    await this.userModel.updateOne(
      { _id: uId },
      {
        $push: {
          pushTokens: {
            token: dto.token,
            platform: dto.platform,
            lastSeenAt: new Date(),
          },
        },
      },
    );

    return { success: true };
  }

  /**
   * Deregister Expo push token on logout
   */
  async deregisterPushToken(userId: string, token: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return { success: true };
    }

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { pushTokens: { token } } },
    );

    return { success: true };
  }

  /**
   * Create an in-app notification and optionally push via Expo Push API
   */
  async sendToUser(
    userId: string,
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    if (!Types.ObjectId.isValid(userId)) return null;

    const uId = new Types.ObjectId(userId);
    const created = await this.notificationModel.create({
      userId: uId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    });

    const user = await this.userModel.findById(uId).lean();
    if (!user) return created;

    // Check user notification preferences
    const notifSettings = user.settings?.notifications;
    let pushAllowed = true;

    if (payload.type === 'streak_reminder' && notifSettings?.streakReminder === false) {
      pushAllowed = false;
    } else if (
      (payload.type === 'new_course' || payload.type === 'new_article') &&
      notifSettings?.newContent === false
    ) {
      pushAllowed = false;
    } else if (payload.type === 'announcement' && notifSettings?.marketing === false) {
      pushAllowed = false;
    }

    if (pushAllowed && user.pushTokens && user.pushTokens.length > 0) {
      const messages = user.pushTokens.map((pt) => ({
        to: pt.token,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: 'default' as const,
      }));

      const res = await this.expoPushService.sendPushNotifications(messages);
      if (res.invalidTokens.length > 0) {
        await this.userModel.updateOne(
          { _id: uId },
          { $pull: { pushTokens: { token: { $in: res.invalidTokens } } } },
        );
      }
    }

    return created;
  }

  /**
   * List push campaigns (Admin CS29)
   */
  async listCampaigns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.pushCampaignModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.pushCampaignModel.countDocuments(),
    ]);

    const formatted = items.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      body: c.body,
      deepLink: c.deepLink,
      segment: c.segment,
      status: c.status,
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString() : undefined,
      sentAt: c.sentAt ? new Date(c.sentAt).toISOString() : undefined,
      stats: c.stats || { targeted: 0, sent: 0, opened: 0 },
      createdBy: c.createdBy.toString(),
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
    }));

    return {
      items: formatted,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Create push campaign (Admin CS29)
   */
  async createCampaign(adminUserId: string, dto: CreatePushCampaignDto) {
    if (!Types.ObjectId.isValid(adminUserId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid admin ID',
      });
    }

    const campaign = await this.pushCampaignModel.create({
      title: dto.title,
      body: dto.body,
      deepLink: dto.deepLink,
      segment: dto.segment,
      status: dto.sendNow ? 'sent' : dto.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdBy: new Types.ObjectId(adminUserId),
    });

    if (dto.sendNow) {
      await this.dispatchCampaign(campaign._id.toString());
    }

    return campaign;
  }

  /**
   * Dispatch push campaign to targeted segment
   */
  async dispatchCampaign(campaignId: string) {
    const campaign = await this.pushCampaignModel.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Campaign not found',
      });
    }

    let targetUsers: UserDocument[] = [];

    if (campaign.segment.type === 'test_device') {
      if (campaign.segment.testToken) {
        const res = await this.expoPushService.sendPushNotifications([
          {
            to: campaign.segment.testToken,
            title: campaign.title,
            body: campaign.body,
            data: { deepLink: campaign.deepLink },
            sound: 'default',
          },
        ]);
        campaign.status = 'sent';
        campaign.sentAt = new Date();
        campaign.stats = { targeted: 1, sent: res.sent, opened: 0 };
        await campaign.save();
        return campaign;
      }
    } else if (campaign.segment.type === 'course_buyers') {
      const enrollments = await this.enrollmentModel.find().lean();
      const userIds = Array.from(new Set(enrollments.map((e) => e.userId.toString())));
      targetUsers = await this.userModel.find({
        _id: { $in: userIds.map((uid) => new Types.ObjectId(uid)) },
        'pushTokens.0': { $exists: true },
      });
    } else {
      // 'all' or default segment
      targetUsers = await this.userModel.find({
        'pushTokens.0': { $exists: true },
      });
    }

    const messages: Array<{
      to: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      sound?: 'default';
    }> = [];
    const targetedUserIds: Types.ObjectId[] = [];

    for (const u of targetUsers) {
      targetedUserIds.push(u._id);
      for (const pt of u.pushTokens || []) {
        messages.push({
          to: pt.token,
          title: campaign.title,
          body: campaign.body,
          data: { deepLink: campaign.deepLink },
          sound: 'default',
        });
      }
    }

    const pushResult = await this.expoPushService.sendPushNotifications(messages);

    // Create in-app notification records for targeted users
    if (targetedUserIds.length > 0) {
      const notifications = targetedUserIds.map((uid) => ({
        userId: uid,
        type: 'announcement',
        title: campaign.title,
        body: campaign.body,
        data: { deepLink: campaign.deepLink },
      }));
      await this.notificationModel.insertMany(notifications);
    }

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.stats = {
      targeted: messages.length,
      sent: pushResult.sent,
      opened: 0,
    };
    await campaign.save();

    return campaign;
  }

  /**
   * Send test push directly to admin's test device (CS29)
   */
  async sendTestPush(
    _adminUserId: string,
    token: string,
    payload: { title: string; body: string; deepLink?: string },
  ) {
    const res = await this.expoPushService.sendPushNotifications([
      {
        to: token,
        title: payload.title,
        body: payload.body,
        data: { deepLink: payload.deepLink },
        sound: 'default',
      },
    ]);

    return {
      success: res.sent > 0,
      sent: res.sent,
      failed: res.failed,
    };
  }

  /**
   * Timezone-aware streak reminder check
   * Evaluates active learners who haven't completed daily practice
   * and sends push if their reminderTime matches current hour in their timezone.
   */
  async runStreakReminderCheck(referenceDate = new Date()): Promise<number> {
    const activeUsers = await this.userModel.find({
      status: 'active',
      'settings.notifications.streakReminder': { $ne: false },
      'pushTokens.0': { $exists: true },
    });

    let remindersSent = 0;

    for (const user of activeUsers) {
      const tz = user.timezone || 'Asia/Kolkata';
      let currentHourString = '09:00';
      let todayDateKey = '';

      try {
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        currentHourString = timeFormatter.format(referenceDate);

        const dateFormatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        todayDateKey = dateFormatter.format(referenceDate);
      } catch {
        // Fallback default
      }

      const reminderTime = user.settings?.reminderTime || '09:00';
      const reminderHour = reminderTime.split(':')[0];
      const currentHour = currentHourString.split(':')[0];

      // Match on the same hour window
      if (reminderHour === currentHour) {
        // Check if user has already been active today
        const lastActive = user.streak?.lastActiveDateKey;
        if (lastActive !== todayDateKey) {
          await this.sendToUser(user._id.toString(), {
            type: 'streak_reminder',
            title: '🔥 Keep Your Streak Alive!',
            body: 'Take 5 minutes today to complete your practice protocol and protect your streak.',
            data: { deepLink: 'sofe://practise' },
          });
          remindersSent++;
        }
      }
    }

    return remindersSent;
  }
}
