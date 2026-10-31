import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ERROR_CODES } from '@sofe/shared';

export interface DecodedLearnerToken {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
}

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.initialized = true;
        this.logger.log('Firebase Admin initialized successfully.');
      } catch (err) {
        this.logger.warn(`Firebase Admin initialization warning: ${(err as Error).message}`);
      }
    } else {
      this.logger.warn(
        'Firebase Admin credentials not fully configured; development/test mode active.',
      );
    }
  }

  async verifyIdToken(token: string): Promise<DecodedLearnerToken> {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Invalid or missing authentication token',
      });
    }

    // Support mock tokens for unit/e2e tests and offline local development
    if (token.startsWith('mock-token-') || token.startsWith('test-token-')) {
      const parts = token.split('-');
      const uid = parts.slice(2).join('-') || 'test-learner-123';
      return {
        uid,
        email: `${uid}@example.com`,
        name: 'Test Founder',
      };
    }

    if (!this.initialized) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Firebase Authentication is not configured on this server',
      });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
        phone_number: decoded.phone_number,
        name: decoded.name,
      };
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Firebase token verification failed or expired',
      });
    }
  }
}
