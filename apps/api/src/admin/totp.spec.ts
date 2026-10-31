import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../common/crypto/crypto.service';
import { TotpService } from '../common/crypto/totp.service';

describe('CryptoService & TotpService', () => {
  let cryptoService: CryptoService;
  let totpService: TotpService;

  beforeEach(() => {
    const configService = new ConfigService({
      FIELD_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=',
      ADMIN_JWT_SECRET: 'test-secret-for-jwt-signing-key-32chars',
    });
    cryptoService = new CryptoService(configService);
    totpService = new TotpService();
  });

  describe('CryptoService', () => {
    it('should encrypt and decrypt a plaintext string correctly', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const encrypted = cryptoService.encrypt(secret);
      expect(encrypted).not.toEqual(secret);
      expect(encrypted.split(':')).toHaveLength(3);

      const decrypted = cryptoService.decrypt(encrypted);
      expect(decrypted).toEqual(secret);
    });

    it('should sign and verify HMAC tokens', () => {
      const payload = { adminId: '12345', roles: ['super_admin'] };
      const token = cryptoService.signToken(payload, 3600);

      const verified = cryptoService.verifyToken<typeof payload>(token);
      expect(verified).not.toBeNull();
      expect(verified?.adminId).toBe('12345');
      expect(verified?.roles).toContain('super_admin');
    });

    it('should reject tampered or expired HMAC tokens', () => {
      const payload = { adminId: '12345' };
      const token = cryptoService.signToken(payload, -10); // already expired

      const verified = cryptoService.verifyToken(token);
      expect(verified).toBeNull();
    });
  });

  describe('TotpService', () => {
    it('should generate a valid Base32 secret and otpauth URI', () => {
      const result = totpService.generateSecret('admin@sofe.org', 'SOFE Admin');
      expect(result.secret).toMatch(/^[A-Z2-7]{32}$/);
      expect(result.otpAuthUri).toContain('otpauth://totp/SOFE%20Admin:admin%40sofe.org');
      expect(result.otpAuthUri).toContain(`secret=${result.secret}`);
    });

    it('should generate 8 alphanumeric backup codes', () => {
      const codes = totpService.generateBackupCodes();
      expect(codes).toHaveLength(8);
      for (const code of codes) {
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      }
    });

    it('should generate and verify 6-digit TOTP codes within time window', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = totpService.generateCode(secret);
      expect(code).toMatch(/^\d{6}$/);

      const isValid = totpService.verify(code, secret);
      expect(isValid).toBe(true);
    });

    it('should accept code with drift within ±1 step (30 seconds)', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const pastCode = totpService.generateCode(secret, Date.now() - 30 * 1000);
      expect(totpService.verify(pastCode, secret, 1)).toBe(true);

      const futureCode = totpService.generateCode(secret, Date.now() + 30 * 1000);
      expect(totpService.verify(futureCode, secret, 1)).toBe(true);

      const tooOldCode = totpService.generateCode(secret, Date.now() - 90 * 1000);
      expect(totpService.verify(tooOldCode, secret, 1)).toBe(false);
    });

    it('should reject invalid 6-digit codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      expect(totpService.verify('000000', secret)).toBe(false);
      expect(totpService.verify('abcdef', secret)).toBe(false);
      expect(totpService.verify('123', secret)).toBe(false);
    });
  });
});
