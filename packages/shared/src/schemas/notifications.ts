import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'streak_reminder',
  'points_earned',
  'new_course',
  'new_article',
  'purchase_confirmed',
  'announcement',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationDataSchema = z
  .object({
    deepLink: z.string().optional(),
    entityId: z.string().optional(),
    points: z.number().optional(),
    badgeUrl: z.string().optional(),
  })
  .passthrough();
export type NotificationDataDto = z.infer<typeof notificationDataSchema>;

export const notificationItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: notificationDataSchema.default({}),
  readAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type NotificationItemDto = z.infer<typeof notificationItemSchema>;

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  unreadOnly: z.coerce.boolean().default(false).optional(),
});
export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>;

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});
export type MarkNotificationsReadDto = z.infer<typeof markNotificationsReadSchema>;

export const pushPlatformSchema = z.enum(['ios', 'android']);
export type PushPlatform = z.infer<typeof pushPlatformSchema>;

import { pushTokenSchema } from './auth';
export type PushTokenDto = z.infer<typeof pushTokenSchema>;

export const deletePushTokenSchema = z.object({
  token: z.string().min(10).max(200),
});
export type DeletePushTokenDto = z.infer<typeof deletePushTokenSchema>;

export const pushSegmentTypeSchema = z.enum([
  'all',
  'inactive_7_days',
  'course_buyers',
  'topic_followers',
  'test_device',
]);
export type PushSegmentType = z.infer<typeof pushSegmentTypeSchema>;

export const pushCampaignSegmentSchema = z.object({
  type: pushSegmentTypeSchema,
  courseId: z.string().optional(),
  topicId: z.string().optional(),
  topicSlug: z.string().optional(),
  testToken: z.string().optional(),
});
export type PushCampaignSegmentDto = z.infer<typeof pushCampaignSegmentSchema>;

export const pushCampaignStatusSchema = z.enum(['draft', 'scheduled', 'sent', 'cancelled']);
export type PushCampaignStatus = z.infer<typeof pushCampaignStatusSchema>;

export const pushCampaignSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(50),
  body: z.string().min(1).max(150),
  deepLink: z.string().optional(),
  segment: pushCampaignSegmentSchema,
  status: pushCampaignStatusSchema.default('draft'),
  scheduledAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
  stats: z.object({
    targeted: z.number().int().nonnegative().default(0),
    sent: z.number().int().nonnegative().default(0),
    opened: z.number().int().nonnegative().default(0),
  }),
  createdBy: z.string().min(1),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type PushCampaignDto = z.infer<typeof pushCampaignSchema>;

export const createPushCampaignSchema = z.object({
  title: z.string().min(1).max(50),
  body: z.string().min(1).max(150),
  deepLink: z.string().optional(),
  segment: pushCampaignSegmentSchema,
  scheduledAt: z.string().datetime().optional(),
  sendNow: z.boolean().default(false).optional(),
});
export type CreatePushCampaignDto = z.infer<typeof createPushCampaignSchema>;

export const sendTestPushSchema = z.object({
  token: z.string().min(10).max(200),
  title: z.string().min(1).max(50),
  body: z.string().min(1).max(150),
  deepLink: z.string().optional(),
});
export type SendTestPushDto = z.infer<typeof sendTestPushSchema>;
