import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${clean[i]}`);
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

@Injectable()
export class TotpService {
  private readonly stepSeconds = 30;
  private readonly digits = 6;

  /**
   * Generates a new 20-byte random Base32 secret and an otpauth URL.
   */
  generateSecret(email: string, issuer = 'SOFE Admin'): { secret: string; otpAuthUri: string } {
    const randomBuffer = crypto.randomBytes(20);
    const secret = base32Encode(randomBuffer);
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    const otpAuthUri = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.digits}&period=${this.stepSeconds}`;
    return { secret, otpAuthUri };
  }

  /**
   * Generates 8 random 8-character backup codes.
   */
  generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Computes the 6-digit TOTP code for a secret at a given counter or current time.
   */
  generateCode(secret: string, timestampMs = Date.now()): string {
    const counter = Math.floor(timestampMs / 1000 / this.stepSeconds);
    const key = base32Decode(secret);

    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const codeNumber =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const modulo = 10 ** this.digits;
    return (codeNumber % modulo).toString().padStart(this.digits, '0');
  }

  /**
   * Verifies a 6-digit TOTP code against the secret within a drift window.
   * Window = 1 allows 1 step before and 1 step after (±30 seconds).
   */
  verify(token: string, secret: string, window = 1): boolean {
    const cleanToken = token.trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    const currentStep = Math.floor(Date.now() / 1000 / this.stepSeconds);

    for (let i = -window; i <= window; i++) {
      const timestamp = (currentStep + i) * this.stepSeconds * 1000;
      const expectedCode = this.generateCode(secret, timestamp);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedCode))) {
        return true;
      }
    }

    return false;
  }
}
