import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MuxService } from './mux.service';
import * as crypto from 'crypto';

describe('MuxService', () => {
  let service: MuxService;

  const mockConfig: Record<string, string> = {
    MUX_TOKEN_ID: 'mock-mux-token-id',
    MUX_TOKEN_SECRET: 'mock-mux-token-secret',
    MUX_SIGNING_KEY_ID: 'signing-key-99',
    MUX_SIGNING_PRIVATE_KEY: 'mock-mux-private-key',
    MUX_WEBHOOK_SECRET: 'test-webhook-secret-xyz',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MuxService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string) => mockConfig[key] ?? defaultValue,
          },
        },
      ],
    }).compile();

    service = module.get<MuxService>(MuxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDirectUploadUrl', () => {
    it('should generate direct upload URL and uploadId in development/test', async () => {
      const upload = await service.createDirectUploadUrl('https://admin.sofe.school');
      expect(upload.uploadUrl).toBeDefined();
      expect(upload.uploadId).toContain('mux-upload-');
    });
  });

  describe('verifyWebhookSignature', () => {
    const sampleBody = JSON.stringify({ id: 'evt-123', type: 'video.asset.ready' });

    it('should return true for a correctly signed webhook event', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payloadToSign = `${timestamp}.${sampleBody}`;
      const signature = crypto
        .createHmac('sha256', 'test-webhook-secret-xyz')
        .update(payloadToSign)
        .digest('hex');

      const header = `t=${timestamp},v1=${signature}`;
      const isValid = service.verifyWebhookSignature(sampleBody, header);
      expect(isValid).toBe(true);
    });

    it('should return false when body has been tampered with', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payloadToSign = `${timestamp}.${sampleBody}`;
      const signature = crypto
        .createHmac('sha256', 'test-webhook-secret-xyz')
        .update(payloadToSign)
        .digest('hex');

      const header = `t=${timestamp},v1=${signature}`;
      const tamperedBody = JSON.stringify({ id: 'evt-tampered', type: 'video.asset.ready' });
      const isValid = service.verifyWebhookSignature(tamperedBody, header);
      expect(isValid).toBe(false);
    });

    it('should reject webhook events with expired timestamp (> 300s)', () => {
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 400; // 400s ago
      const payloadToSign = `${expiredTimestamp}.${sampleBody}`;
      const signature = crypto
        .createHmac('sha256', 'test-webhook-secret-xyz')
        .update(payloadToSign)
        .digest('hex');

      const header = `t=${expiredTimestamp},v1=${signature}`;
      const isValid = service.verifyWebhookSignature(sampleBody, header);
      expect(isValid).toBe(false);
    });

    it('should return false for malformed header', () => {
      expect(service.verifyWebhookSignature(sampleBody, '')).toBe(false);
      expect(service.verifyWebhookSignature(sampleBody, 'invalid-header')).toBe(false);
    });
  });

  describe('generatePlaybackToken', () => {
    it('should create valid 3-part JWT token with claims', () => {
      const token = service.generatePlaybackToken('playback-xyz-789');
      const parts = token.split('.');
      expect(parts.length).toBe(3);

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      expect(header.kid).toBe('signing-key-99');
      expect(payload.sub).toBe('playback-xyz-789');
      expect(payload.aud).toBe('v');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});
