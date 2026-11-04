import { z } from 'zod';
import { USER_STATUSES } from '../enums/auth';
import { VISIBILITIES } from '../enums/community';
import { timeSchema } from './common';

export const userStatusSchema = z.enum(Object.values(USER_STATUSES) as [string, ...string[]]);

export const visibilitySchema = z.enum(Object.values(VISIBILITIES) as [string, ...string[]]);

export const platformSchema = z.enum(['ios', 'android', 'web']);

export const pushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android']),
});

export const quoteSchema = z.object({
  text: z.string().min(1).max(500),
  author: z.string().max(100).optional(),
  source: z.enum(['library', 'custom']),
  quoteId: z.string().optional(),
});

export const patchMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(160).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  goals: z.array(z.string().max(100)).max(10).optional(),
  quote: quoteSchema.optional(),
  manifestationWord: z.string().max(50).optional(),
  onboardingCompletedAt: z.string().datetime().or(z.date()).optional(),
});

export const userSettingsSchema = z.object({
  notifications: z.object({
    streakReminder: z.boolean().default(true),
    newContent: z.boolean().default(true),
    social: z.boolean().default(true),
    marketing: z.boolean().default(false),
  }),
  reminderTime: timeSchema.default('09:00'),
  profileVisibility: visibilitySchema.default(VISIBILITIES.PUBLIC),
});

export const patchUserSettingsSchema = userSettingsSchema.deepPartial();

export const planPreferencesSchema = z.object({
  enabledTaskKeys: z.array(z.string()).min(1),
});

export const adminVerify2faSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '2FA code must be 6 digits'),
});

export const adminSessionSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase token is required'),
});

export const adminVerify2faBodySchema = z.object({
  tempToken: z.string().optional(),
  code: z.string().regex(/^\d{6}$/, '2FA code must be 6 digits'),
});
