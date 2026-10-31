import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['dev', 'staging', 'prod']).default('dev'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  TZ: z.string().default('UTC'),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/sofe_dev'),
  MONGODB_DB_NAME: z.string().default('sofe_dev'),
  FIELD_ENCRYPTION_KEY: z.string().default('MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE='),
  ADMIN_JWT_SECRET: z.string().default('dev-admin-jwt-secret-key-32chars-min!'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default('sofe-dev'),
  CLOUDINARY_API_KEY: z.string().default('mock-cloudinary-key'),
  CLOUDINARY_API_SECRET: z.string().default('mock-cloudinary-secret'),

  // Mux
  MUX_TOKEN_ID: z.string().default('mock-mux-token-id'),
  MUX_TOKEN_SECRET: z.string().default('mock-mux-token-secret'),
  MUX_SIGNING_KEY_ID: z.string().default('mock-mux-signing-key-id'),
  MUX_SIGNING_PRIVATE_KEY: z.string().default('mock-mux-signing-private-key'),
  MUX_WEBHOOK_SECRET: z.string().default('mock-mux-webhook-secret'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}
