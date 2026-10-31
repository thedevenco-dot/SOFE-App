import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ADMIN_ROLES, type AdminPermission, ERROR_CODES, ROLE_PERMISSIONS_MAP } from '@sofe/shared';
import { AdminUser, AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { CryptoService } from '../crypto/crypto.service';
import { ADMIN_PERMISSION_KEY } from '../decorators/admin-auth.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  roles: string[];
  type?: 'session' | 'temp-2fa';
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    private readonly cryptoService: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Admin authorization header missing or malformed',
      });
    }

    const token = authHeader.slice(7).trim();
    let admin: AdminUserDocument | null = null;

    // Check signed admin session token
    const payload = this.cryptoService.verifyToken<AdminSessionPayload>(token);
    if (payload && payload.adminId) {
      admin = await this.adminUserModel.findById(payload.adminId).exec();
    } else if (process.env.NODE_ENV !== 'production' && token.startsWith('test-admin:')) {
      // Development / testing mock admin token: test-admin:<email-or-uid>
      const identifier = token.split(':')[1];
      admin = await this.adminUserModel
        .findOne({
          $or: [{ email: identifier }, { firebaseUid: identifier }],
        })
        .exec();
    }

    if (!admin) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Invalid or expired admin session token',
      });
    }

    if (admin.status !== 'active') {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Admin account is disabled',
      });
    }

    // Compute effective permissions as union of permissions across all admin roles
    const effectivePermissions = new Set<AdminPermission>();
    let isSuperAdmin = false;

    for (const role of admin.roles) {
      if (role === ADMIN_ROLES.SUPER_ADMIN) {
        isSuperAdmin = true;
      }
      const perms = ROLE_PERMISSIONS_MAP[role];
      if (perms) {
        for (const perm of perms) {
          effectivePermissions.add(perm);
        }
      }
    }

    // Check specific required permission if set
    const requiredPermission = this.reflector.getAllAndOverride<AdminPermission | undefined>(
      ADMIN_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermission && !isSuperAdmin && !effectivePermissions.has(requiredPermission)) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: `Missing required permission: ${requiredPermission}`,
      });
    }

    // Attach to request
    request.admin = admin;
    request.adminPermissions = Array.from(effectivePermissions);

    return true;
  }
}
