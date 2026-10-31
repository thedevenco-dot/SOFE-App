declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * Environment configuration for the mobile client.
 */
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'dev',
} as const;
