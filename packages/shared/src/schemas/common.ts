import { z } from 'zod';
import { ERROR_CODES } from '../errors/codes';

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date key must be in YYYY-MM-DD format');

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format');

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character hex ObjectId');

export const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const paginationMetaSchema = z.object({
  nextCursor: z.string().nullable().optional(),
  total: z.number().int().nonnegative().optional(),
});

export const apiErrorDetailsSchema = z.record(z.string(), z.unknown());

export const apiErrorSchema = z.object({
  code: z.enum(Object.values(ERROR_CODES) as [string, ...string[]]),
  message: z.string(),
  details: apiErrorDetailsSchema.optional(),
});

export const apiErrorEnvelopeSchema = z.object({
  error: apiErrorSchema,
});

export function createSuccessEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: paginationMetaSchema.optional(),
  });
}
