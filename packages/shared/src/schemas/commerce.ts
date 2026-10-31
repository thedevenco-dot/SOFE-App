import { z } from 'zod';
import { LEAD_SOURCES } from '../enums/community';

export const createOrderSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  couponCode: z.string().trim().toUpperCase().optional(),
});

export const confirmIapSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').toUpperCase(),
  courseId: z.string().min(1, 'Course ID is required'),
});

export const utmParamsSchema = z.object({
  source: z.string().max(100).optional(),
  medium: z.string().max(100).optional(),
  campaign: z.string().max(100).optional(),
  content: z.string().max(100).optional(),
});

export const createLeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  source: z
    .enum(Object.values(LEAD_SOURCES) as [string, ...string[]])
    .default(LEAD_SOURCES.FRAMER_FORM),
  utm: utmParamsSchema.optional(),
  captchaToken: z.string().optional(),
});
