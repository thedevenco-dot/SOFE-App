import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import * as crypto from 'crypto';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const mockConfig: Record<string, string> = {
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key-123',
    CLOUDINARY_API_SECRET: 'test-secret-456',
    APP_ENV: 'dev',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string) => mockConfig[key] ?? defaultValue,
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUpload', () => {
    it('should generate valid Cloudinary signature and upload parameters', () => {
      const result = service.signUpload('avatar');

      expect(result.cloudName).toBe('test-cloud');
      expect(result.apiKey).toBe('test-key-123');
      expect(result.folder).toBe('sofe/dev/avatar');
      expect(result.uploadUrl).toBe('https://api.cloudinary.com/v1_1/test-cloud/auto/upload');
      expect(result.timestamp).toBeGreaterThan(0);

      // Verify signature manually
      const expectedParams = `folder=sofe/dev/avatar&timestamp=${result.timestamp}test-secret-456`;
      const expectedSig = crypto.createHash('sha1').update(expectedParams).digest('hex');
      expect(result.signature).toBe(expectedSig);
    });

    it('should include public_id in signature calculation when provided', () => {
      const result = service.signUpload('course_thumbnail', 'custom-thumbnail-id');

      expect(result.publicId).toBe('custom-thumbnail-id');
      const expectedParams = `folder=sofe/dev/course_thumbnail&public_id=custom-thumbnail-id&timestamp=${result.timestamp}test-secret-456`;
      const expectedSig = crypto.createHash('sha1').update(expectedParams).digest('hex');
      expect(result.signature).toBe(expectedSig);
    });
  });

  describe('signPrivateDownloadUrl', () => {
    it('should generate signed short-lived delivery URL', () => {
      const url = service.signPrivateDownloadUrl('books/guide-101', 'pdf', 1800);
      expect(url).toContain('https://res.cloudinary.com/test-cloud/raw/upload/');
      expect(url).toContain('expires_at=');
      expect(url).toContain('books/guide-101.pdf');
    });
  });
});
