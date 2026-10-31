import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UploadPurpose, UploadSignResponseDto } from '@sofe/shared';

@Injectable()
export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly appEnv: string;

  constructor(private readonly config: ConfigService) {
    this.cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME', 'sofe-dev');
    this.apiKey = this.config.get<string>('CLOUDINARY_API_KEY', 'mock-cloudinary-key');
    this.apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET', 'mock-cloudinary-secret');
    this.appEnv = this.config.get<string>('APP_ENV', 'dev');
  }

  /**
   * Generates a signed direct-upload payload for client-side uploads.
   * Parameters are ordered alphabetically and signed with HMAC-SHA1 per Cloudinary spec.
   */
  signUpload(purpose: UploadPurpose, publicId?: string): UploadSignResponseDto {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `sofe/${this.appEnv}/${purpose}`;

    // Cloudinary signature algorithm:
    // Sort all parameters to be signed alphabetically, joined by '&' with 'key=value',
    // then append apiSecret directly, and compute SHA1 hex digest.
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    if (publicId) {
      paramsToSign['public_id'] = publicId;
    }

    const serializedParams = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join('&');

    const toSignString = `${serializedParams}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSignString).digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;

    return {
      signature,
      timestamp,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
      uploadUrl,
      publicId,
    };
  }

  /**
   * Generates a signed short-lived delivery URL for private resources (e.g., books/PDFs).
   */
  signPrivateDownloadUrl(publicId: string, format = 'pdf', expiresInSec = 3600): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
    const toSign = `s--${publicId}.${format}--${expiresAt}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('base64url');

    return `https://res.cloudinary.com/${this.cloudName}/raw/upload/s--${signature}--/v1/${publicId}.${format}?expires_at=${expiresAt}`;
  }
}
