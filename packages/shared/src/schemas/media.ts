import { z } from 'zod';

export const UPLOAD_PURPOSES = [
  'avatar',
  'vision',
  'project',
  'post',
  'course_thumbnail',
  'article_cover',
  'book_cover',
  'resource_file',
] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const uploadSignRequestSchema = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  filename: z.string().optional(),
});
export type UploadSignRequestDto = z.infer<typeof uploadSignRequestSchema>;

export const uploadSignResponseSchema = z.object({
  signature: z.string(),
  timestamp: z.number().int(),
  apiKey: z.string(),
  cloudName: z.string(),
  folder: z.string(),
  uploadUrl: z.string().url(),
  publicId: z.string().optional(),
});
export type UploadSignResponseDto = z.infer<typeof uploadSignResponseSchema>;

export const videoUploadRequestSchema = z.object({
  corsOrigin: z.string().optional(),
  passthrough: z.string().optional(),
});
export type VideoUploadRequestDto = z.infer<typeof videoUploadRequestSchema>;

export const videoUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  uploadId: z.string(),
});
export type VideoUploadResponseDto = z.infer<typeof videoUploadResponseSchema>;

export const playbackTokenResponseSchema = z.object({
  token: z.string(),
  playbackId: z.string(),
});
export type PlaybackTokenResponseDto = z.infer<typeof playbackTokenResponseSchema>;
