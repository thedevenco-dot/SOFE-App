import { Injectable, Logger } from '@nestjs/common';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
}

export interface ExpoPushResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expoUrl = 'https://exp.host/--/api/v2/push/send';

  isExpoPushToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    return (
      token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[') ||
      /^[a-zA-Z0-9_-]{20,}$/.test(token)
    );
  }

  async sendPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushResult> {
    const validMessages: ExpoPushMessage[] = [];
    const invalidTokens: string[] = [];

    for (const msg of messages) {
      if (this.isExpoPushToken(msg.to)) {
        validMessages.push(msg);
      } else {
        invalidTokens.push(msg.to);
      }
    }

    if (validMessages.length === 0) {
      return { sent: 0, failed: invalidTokens.length, invalidTokens };
    }

    // Chunk into batches of up to 100 messages
    const chunkSize = 100;
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < validMessages.length; i += chunkSize) {
      chunks.push(validMessages.slice(i, i + chunkSize));
    }

    let sent = 0;
    let failed = invalidTokens.length;

    for (const chunk of chunks) {
      try {
        const response = await fetch(this.expoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          this.logger.warn(`Expo push API returned status ${response.status}`);
          failed += chunk.length;
          continue;
        }

        const json = (await response.json()) as {
          data?: Array<{ status: string; details?: { error?: string } }>;
        };
        const tickets = json.data || [];

        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const token = chunk[i]?.to;

          if (ticket.status === 'ok') {
            sent++;
          } else {
            failed++;
            if (
              ticket.details?.error === 'DeviceNotRegistered' &&
              token &&
              !invalidTokens.includes(token)
            ) {
              invalidTokens.push(token);
            }
          }
        }
      } catch (err) {
        this.logger.error('Failed to dispatch Expo push chunk', err);
        failed += chunk.length;
      }
    }

    return { sent, failed, invalidTokens };
  }
}
