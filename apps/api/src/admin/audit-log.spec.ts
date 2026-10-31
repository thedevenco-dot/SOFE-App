import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { AdminAuditService, CreateAuditLogDto } from './admin-audit.service';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { AdminUserDocument } from '../database/schemas/admin-user.schema';

describe('AdminAuditService & AuditLogInterceptor', () => {
  let auditService: AdminAuditService;
  let interceptor: AuditLogInterceptor;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    auditService = {
      createLog: jest.fn().mockResolvedValue({}),
      findLogs: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as AdminAuditService;

    interceptor = new AuditLogInterceptor(reflector, auditService);
  });

  describe('AuditLogInterceptor', () => {
    it('should ignore non-write GET requests', (done) => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ method: 'GET', admin: { _id: 'admin1', email: 'a@sofe.org' } }),
        }),
      } as unknown as ExecutionContext;

      const handler: CallHandler = {
        handle: () => of({ data: 'ok' }),
      };

      interceptor.intercept(context, handler).subscribe(() => {
        expect(auditService.createLog).not.toHaveBeenCalled();
        done();
      });
    });

    it('should ignore write requests that do not have an authenticated admin', (done) => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ method: 'POST', admin: undefined }),
        }),
      } as unknown as ExecutionContext;

      const handler: CallHandler = {
        handle: () => of({ data: 'ok' }),
      };

      interceptor.intercept(context, handler).subscribe(() => {
        expect(auditService.createLog).not.toHaveBeenCalled();
        done();
      });
    });

    it('should record an audit log for POST requests with sensitive fields sanitized', (done) => {
      const mockAdmin = {
        _id: 'admin-obj-123',
        email: 'moderator@sofe.org',
      } as unknown as AdminUserDocument;

      const request = {
        method: 'POST',
        admin: mockAdmin,
        route: { path: '/api/v1/admin/users/:id/status' },
        params: { id: 'user-789' },
        headers: {
          'user-agent': 'Jest-Agent',
          'x-forwarded-for': '192.168.1.100',
        },
        body: {
          status: 'suspended',
          reason: 'Spamming',
          password: 'secretPassword123',
          totpSecretEnc: 'sensitive-enc-secret',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(context, handler).subscribe(() => {
        expect(auditService.createLog).toHaveBeenCalledTimes(1);
        const loggedDto: CreateAuditLogDto = (auditService.createLog as jest.Mock).mock.calls[0][0];

        expect(loggedDto.actorAdminId).toBe('admin-obj-123');
        expect(loggedDto.actorEmail).toBe('moderator@sofe.org');
        expect(loggedDto.entityId).toBe('user-789');
        expect(loggedDto.ip).toBe('192.168.1.100');
        expect(loggedDto.userAgent).toBe('Jest-Agent');

        // Verify sensitive fields are redacted
        expect(loggedDto.after?.['password']).toBe('[REDACTED]');
        expect(loggedDto.after?.['totpSecretEnc']).toBe('[REDACTED]');
        expect(loggedDto.after?.['status']).toBe('suspended');
        done();
      });
    });
  });
});
