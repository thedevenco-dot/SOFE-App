import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ADMIN_ROLES,
  ALL_PERMISSIONS,
  type AdminPermission,
  ERROR_CODES,
  ROLE_PERMISSIONS_MAP,
} from '@sofe/shared';
import { AdminUser, AdminUserDocument } from '../database/schemas/admin-user.schema';
import { CryptoService } from '../common/crypto/crypto.service';
import { TotpService } from '../common/crypto/totp.service';
import { FirebaseService } from '../auth/firebase/firebase.service';

export interface AdminLoginResponse {
  requires2fa?: boolean;
  requires2faSetup?: boolean;
  tempToken: string;
}

export interface AdminVerifyResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: AdminPermission[];
    twoFactorEnabled: boolean;
  };
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    private readonly cryptoService: CryptoService,
    private readonly totpService: TotpService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Compute the effective union of permissions for an admin's assigned roles.
   */
  getPermissionsForAdmin(admin: AdminUser): AdminPermission[] {
    if (admin.roles.includes(ADMIN_ROLES.SUPER_ADMIN)) {
      return [...ALL_PERMISSIONS];
    }

    const perms = new Set<AdminPermission>();
    for (const role of admin.roles) {
      const rolePerms = ROLE_PERMISSIONS_MAP[role] || [];
      for (const p of rolePerms) {
        perms.add(p);
      }
    }

    return Array.from(perms);
  }

  /**
   * Exchanges Firebase credential for admin 2FA verification step.
   */
  async createSession(firebaseToken: string): Promise<AdminLoginResponse> {
    let firebaseUid: string;
    let email: string | undefined;

    // Support mock dev/test token: test-admin:<email-or-uid>
    if (process.env.NODE_ENV !== 'production' && firebaseToken.startsWith('test-admin:')) {
      const identifier = firebaseToken.split(':')[1];
      if (identifier.includes('@')) {
        email = identifier;
        firebaseUid = `uid-${identifier}`;
      } else {
        firebaseUid = identifier;
      }
    } else {
      const decoded = await this.firebaseService.verifyIdToken(firebaseToken);
      firebaseUid = decoded.uid;
      email = decoded.email;
    }

    const filter: Record<string, unknown>[] = [{ firebaseUid }];
    if (email) filter.push({ email });

    const admin = await this.adminUserModel.findOne({ $or: filter }).exec();

    if (!admin) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Admin account not found',
      });
    }

    if (admin.status !== 'active') {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Admin account is disabled',
      });
    }

    // Generate temporary 15-minute token for 2FA flow
    const tempToken = this.cryptoService.signToken(
      {
        adminId: admin._id.toString(),
        email: admin.email,
        type: 'temp-2fa',
      },
      15 * 60,
    );

    if (!admin.twoFactorEnabled) {
      return {
        requires2faSetup: true,
        tempToken,
      };
    }

    return {
      requires2fa: true,
      tempToken,
    };
  }

  /**
   * Resolves an AdminUser document from either a Bearer tempToken or body tempToken.
   */
  async resolveAdminFromTempToken(tempToken: string): Promise<AdminUserDocument> {
    const payload = this.cryptoService.verifyToken<{
      adminId: string;
      type: string;
    }>(tempToken);

    if (!payload || !payload.adminId) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Invalid or expired 2FA session token',
      });
    }

    const admin = await this.adminUserModel.findById(payload.adminId).exec();
    if (!admin || admin.status !== 'active') {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Admin account not found or disabled',
      });
    }

    return admin;
  }

  /**
   * Setup 2FA for an admin account: generates secret, encrypts it, and saves it.
   */
  async setup2fa(admin: AdminUserDocument) {
    const { secret, otpAuthUri } = this.totpService.generateSecret(admin.email);
    const backupCodes = this.totpService.generateBackupCodes();

    const encrypted = this.cryptoService.encrypt(secret);
    admin.totpSecretEnc = encrypted;
    await admin.save();

    return {
      secret,
      otpAuthUri,
      backupCodes,
    };
  }

  /**
   * Verifies 6-digit TOTP code and activates 2FA, issuing an 8-hour session token.
   */
  async verify2fa(admin: AdminUserDocument, code: string): Promise<AdminVerifyResponse> {
    if (!admin.totpSecretEnc) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: '2FA has not been setup for this account yet',
      });
    }

    let secret: string;
    try {
      secret = this.cryptoService.decrypt(admin.totpSecretEnc);
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Corrupted 2FA secret on file',
      });
    }

    const isValid = this.totpService.verify(code, secret);
    if (!isValid) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Invalid 2FA verification code',
      });
    }

    admin.twoFactorEnabled = true;
    admin.lastLoginAt = new Date();
    await admin.save();

    const sessionToken = this.cryptoService.signToken(
      {
        adminId: admin._id.toString(),
        email: admin.email,
        roles: admin.roles,
        type: 'session',
      },
      8 * 3600,
    );

    const permissions = this.getPermissionsForAdmin(admin);

    return {
      token: sessionToken,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        roles: admin.roles,
        permissions,
        twoFactorEnabled: admin.twoFactorEnabled,
      },
    };
  }
}
