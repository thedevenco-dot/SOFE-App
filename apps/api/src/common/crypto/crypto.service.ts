import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly encryptionKey: Buffer;
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    const rawKey = this.configService.get<string>(
      'FIELD_ENCRYPTION_KEY',
      'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=',
    );

    // If valid base64 with 32 bytes, use it; otherwise sha256 hash to 32 bytes
    let keyBuf = Buffer.from(rawKey, 'base64');
    if (keyBuf.length !== 32) {
      keyBuf = crypto.createHash('sha256').update(rawKey).digest();
    }
    this.encryptionKey = keyBuf;

    this.jwtSecret = this.configService.get<string>(
      'ADMIN_JWT_SECRET',
      'dev-admin-jwt-secret-key-32chars-min!',
    );
  }

  /**
   * Encrypt plaintext using AES-256-GCM.
   * Format: iv:authTag:ciphertext (hex encoded)
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt AES-256-GCM ciphertext.
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Signs a lightweight HMAC-SHA256 token (used for admin sessions and temp 2FA auth).
   * Format: base64(header).base64(payload).base64url(signature)
   */
  signToken(payload: Record<string, unknown>, expiresInSec = 8 * 3600): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSec,
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const dataToSign = `${headerB64}.${payloadB64}`;
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(dataToSign)
      .digest('base64url');

    return `${dataToSign}.${signature}`;
  }

  /**
   * Verifies an HMAC-SHA256 token and returns its payload if valid and not expired.
   */
  verifyToken<T = Record<string, unknown>>(token: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signature] = parts;
      const dataToSign = `${headerB64}.${payloadB64}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(dataToSign)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as T & {
        exp?: number;
      };

      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
