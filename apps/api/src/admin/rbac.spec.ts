import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Model } from 'mongoose';
import { ADMIN_PERMISSIONS, ADMIN_ROLES, type AdminPermission, type AdminRole } from '@sofe/shared';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminUserDocument } from '../database/schemas/admin-user.schema';
import { CryptoService } from '../common/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';

describe('Admin RBAC & AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let reflector: Reflector;
  let cryptoService: CryptoService;

  function createMockAdmin(roles: AdminRole[], status = 'active'): Partial<AdminUserDocument> {
    return {
      _id: 'admin-obj-id-123' as unknown,
      email: 'admin@sofe.org',
      name: 'Test Admin',
      roles,
      status: status as unknown as 'active',
      twoFactorEnabled: true,
    } as Partial<AdminUserDocument>;
  }

  function createMockExecutionContext(
    authHeader?: string,
    requiredPermission?: AdminPermission,
    isPublic = false,
  ): { context: ExecutionContext; request: Record<string, unknown> } {
    const request: Record<string, unknown> = {
      headers: authHeader ? { authorization: authHeader } : {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === 'isPublic') return isPublic;
      if (key === 'adminPermission') return requiredPermission;
      return undefined;
    });

    return { context, request };
  }

  beforeEach(() => {
    reflector = new Reflector();
    const configService = new ConfigService({
      FIELD_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=',
      ADMIN_JWT_SECRET: 'test-secret-for-jwt-signing-key-32chars',
    });
    cryptoService = new CryptoService(configService);
  });

  describe('Unauthenticated and Disabled Accounts', () => {
    it('should throw UnauthorizedException when header is missing', async () => {
      const mockModel = {} as Model<AdminUserDocument>;
      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);

      const { context } = createMockExecutionContext();
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when admin account is disabled', async () => {
      const disabledAdmin = createMockAdmin([ADMIN_ROLES.SUPER_ADMIN], 'disabled');
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(disabledAdmin),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);

      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });
      const { context } = createMockExecutionContext(`Bearer ${token}`);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Role Matrix Coverage (PERMISSIONS.md)', () => {
    it('super_admin should have access to ALL permissions', async () => {
      const superAdmin = createMockAdmin([ADMIN_ROLES.SUPER_ADMIN]);
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(superAdmin),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);
      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });

      const testPermissions = [
        ADMIN_PERMISSIONS.COURSE_WRITE,
        ADMIN_PERMISSIONS.USER_SUSPEND,
        ADMIN_PERMISSIONS.ORDER_REFUND,
        ADMIN_PERMISSIONS.ADMIN_MANAGE,
        ADMIN_PERMISSIONS.AUDIT_READ,
      ];

      for (const perm of testPermissions) {
        const { context, request } = createMockExecutionContext(`Bearer ${token}`, perm);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(request.admin).toBeDefined();
      }
    });

    it('content_editor should be allowed content permissions and denied user/finance permissions', async () => {
      const contentEditor = createMockAdmin([ADMIN_ROLES.CONTENT_EDITOR]);
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(contentEditor),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);
      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });

      // Allowed
      const allowedPerms = [
        ADMIN_PERMISSIONS.COURSE_WRITE,
        ADMIN_PERMISSIONS.ARTICLE_PUBLISH,
        ADMIN_PERMISSIONS.QUIZ_WRITE,
        ADMIN_PERMISSIONS.PUSH_SEND,
      ];
      for (const perm of allowedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).resolves.toBe(true);
      }

      // Denied
      const deniedPerms = [
        ADMIN_PERMISSIONS.USER_SUSPEND,
        ADMIN_PERMISSIONS.ORDER_REFUND,
        ADMIN_PERMISSIONS.ADMIN_MANAGE,
      ];
      for (const perm of deniedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }
    });

    it('moderator should be allowed moderation permissions and denied content/finance permissions', async () => {
      const moderator = createMockAdmin([ADMIN_ROLES.MODERATOR]);
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(moderator),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);
      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });

      // Allowed
      const allowedPerms = [
        ADMIN_PERMISSIONS.USER_READ,
        ADMIN_PERMISSIONS.USER_SUSPEND,
        ADMIN_PERMISSIONS.REPORT_ACTION,
        ADMIN_PERMISSIONS.POST_REMOVE,
      ];
      for (const perm of allowedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).resolves.toBe(true);
      }

      // Denied
      const deniedPerms = [
        ADMIN_PERMISSIONS.COURSE_WRITE,
        ADMIN_PERMISSIONS.ORDER_REFUND,
        ADMIN_PERMISSIONS.COUPON_WRITE,
      ];
      for (const perm of deniedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }
    });

    it('sales_support should be allowed leads & support and denied destructive actions', async () => {
      const salesSupport = createMockAdmin([ADMIN_ROLES.SALES_SUPPORT]);
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(salesSupport),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);
      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });

      // Allowed
      const allowedPerms = [
        ADMIN_PERMISSIONS.LEAD_READ,
        ADMIN_PERMISSIONS.LEAD_WRITE,
        ADMIN_PERMISSIONS.SUPPORT_REPLY,
        ADMIN_PERMISSIONS.ORDER_READ,
      ];
      for (const perm of allowedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).resolves.toBe(true);
      }

      // Denied
      const deniedPerms = [
        ADMIN_PERMISSIONS.COURSE_WRITE,
        ADMIN_PERMISSIONS.USER_SUSPEND,
        ADMIN_PERMISSIONS.ORDER_REFUND,
      ];
      for (const perm of deniedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }
    });

    it('finance should be allowed orders, refunds & invoices and denied content/user write', async () => {
      const finance = createMockAdmin([ADMIN_ROLES.FINANCE]);
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(finance),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);
      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });

      // Allowed
      const allowedPerms = [
        ADMIN_PERMISSIONS.ORDER_REFUND,
        ADMIN_PERMISSIONS.COUPON_WRITE,
        ADMIN_PERMISSIONS.INVOICE_READ,
        ADMIN_PERMISSIONS.INVOICE_EXPORT,
        ADMIN_PERMISSIONS.EXPENSE_WRITE,
      ];
      for (const perm of allowedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).resolves.toBe(true);
      }

      // Denied
      const deniedPerms = [
        ADMIN_PERMISSIONS.COURSE_WRITE,
        ADMIN_PERMISSIONS.USER_SUSPEND,
        ADMIN_PERMISSIONS.ADMIN_MANAGE,
      ];
      for (const perm of deniedPerms) {
        const { context } = createMockExecutionContext(`Bearer ${token}`, perm);
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }
    });

    it('admin with multiple roles should have the UNION of permissions', async () => {
      const multiRoleAdmin = createMockAdmin([ADMIN_ROLES.MODERATOR, ADMIN_ROLES.FINANCE]);
      const mockModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(multiRoleAdmin),
        }),
      } as unknown as Model<AdminUserDocument>;

      guard = new AdminAuthGuard(reflector, mockModel, cryptoService);
      const token = cryptoService.signToken({ adminId: 'admin-obj-id-123' });

      // Moderator permission
      const modContext = createMockExecutionContext(
        `Bearer ${token}`,
        ADMIN_PERMISSIONS.USER_SUSPEND,
      ).context;
      await expect(guard.canActivate(modContext)).resolves.toBe(true);

      // Finance permission
      const finContext = createMockExecutionContext(
        `Bearer ${token}`,
        ADMIN_PERMISSIONS.ORDER_REFUND,
      ).context;
      await expect(guard.canActivate(finContext)).resolves.toBe(true);

      // Neither role has course:write
      const deniedContext = createMockExecutionContext(
        `Bearer ${token}`,
        ADMIN_PERMISSIONS.COURSE_WRITE,
      ).context;
      await expect(guard.canActivate(deniedContext)).rejects.toThrow(ForbiddenException);
    });
  });
});
