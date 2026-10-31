import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { VideoUploadResponseDto } from '@sofe/shared';

@Injectable()
export class MuxService {
  private readonly logger = new Logger(MuxService.name);
  private readonly tokenId: string;
  private readonly tokenSecret: string;
  private readonly signingKeyId: string;
  private readonly signingPrivateKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.tokenId = this.config.get<string>('MUX_TOKEN_ID', 'mock-mux-token-id');
    this.tokenSecret = this.config.get<string>('MUX_TOKEN_SECRET', 'mock-mux-token-secret');
    this.signingKeyId = this.config.get<string>('MUX_SIGNING_KEY_ID', 'mock-mux-signing-key-id');
    this.signingPrivateKey = this.config.get<string>(
      'MUX_SIGNING_PRIVATE_KEY',
      'mock-mux-signing-private-key',
    );
    this.webhookSecret = this.config.get<string>('MUX_WEBHOOK_SECRET', 'mock-mux-webhook-secret');
  }

  /**
   * Creates a direct video upload URL with signed playback policy for lesson/course media.
   */
  async createDirectUploadUrl(
    corsOrigin = '*',
    passthrough?: string,
  ): Promise<VideoUploadResponseDto> {
    const isMock =
      !this.tokenId ||
      this.tokenId.startsWith('mock') ||
      !this.tokenSecret ||
      this.tokenSecret.startsWith('mock');

    if (isMock) {
      const mockUploadId = `mux-upload-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      return {
        uploadUrl: `https://storage.googleapis.com/mux-direct-mock-uploads/${mockUploadId}`,
        uploadId: mockUploadId,
      };
    }

    try {
      const authHeader = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64');
      const response = await fetch('https://api.mux.com/video/v1/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cors_origin: corsOrigin,
          new_asset_settings: {
            playback_policy: ['signed'],
            passthrough,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mux API upload failed (${response.status}): ${errorText}`);
      }

      const json = (await response.json()) as { data: { url: string; id: string } };
      return {
        uploadUrl: json.data.url,
        uploadId: json.data.id,
      };
    } catch (err) {
      this.logger.error('Failed to create Mux direct upload', err);
      throw err;
    }
  }

  /**
   * Verifies the cryptographic signature of an incoming Mux webhook event.
   * Header format: "t=1565120368,v1=25e2479e3a88b7762a4d334e2c3"
   */
  verifyWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader: string,
    toleranceSec = 300,
  ): boolean {
    if (!signatureHeader || !this.webhookSecret) {
      return false;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // Parse header elements
    const elements = signatureHeader.split(',');
    let timestamp: number | null = null;
    const signatures: string[] = [];

    for (const element of elements) {
      const [key, value] = element.trim().split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // Verify freshness against replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSec) {
      this.logger.warn(`Mux webhook timestamp expired (drift: ${Math.abs(now - timestamp)}s)`);
      return false;
    }

    // Expected signature: HMAC-SHA256(secret, `${timestamp}.${bodyString}`)
    const payloadToSign = `${timestamp}.${bodyString}`;
    const expectedSig = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadToSign)
      .digest('hex');

    // Timing-safe comparison against any provided v1 signature
    for (const sig of signatures) {
      if (sig.length === expectedSig.length) {
        const sigBuf = Buffer.from(sig);
        const expectedBuf = Buffer.from(expectedSig);
        if (crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generates a signed playback token for authorized learners.
   * Uses RS256 with the Mux private key (or HMAC in mock dev mode).
   */
  generatePlaybackToken(playbackId: string, expiresInSec = 43200): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.signingKeyId,
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: playbackId,
      aud: 'v',
      exp: now + expiresInSec,
      iat: now,
    };

    const encode = (obj: Record<string, unknown>) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');

    const headerB64 = encode(header);
    const payloadB64 = encode(payload);
    const dataToSign = `${headerB64}.${payloadB64}`;

    // If private key is an RSA private key (starts with PEM header), sign with RS256
    if (
      this.signingPrivateKey.includes('BEGIN PRIVATE KEY') ||
      this.signingPrivateKey.includes('BEGIN RSA PRIVATE KEY')
    ) {
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(dataToSign);
      const signatureB64 = signer.sign(this.signingPrivateKey, 'base64url');
      return `${dataToSign}.${signatureB64}`;
    }

    // Fallback signature for development and tests
    const devSignature = crypto
      .createHmac('sha256', this.tokenSecret || 'dev-secret')
      .update(dataToSign)
      .digest('base64url');

    return `${dataToSign}.${devSignature}`;
  }
}
