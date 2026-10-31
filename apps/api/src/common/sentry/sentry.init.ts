import * as Sentry from '@sentry/node';

export function initSentry(dsn?: string): void {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env['APP_ENV'] || process.env['NODE_ENV'] || 'dev',
    tracesSampleRate: 1.0,
  });
}
