import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdminAuditService } from '../../admin/admin-audit.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AUDIT_ACTION_KEY, AuditActionMetadata } from '../decorators/audit-action.decorator';

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'totpsecretenc',
  'token',
  'temptoken',
  'authorization',
  'cookie',
  'creditcard',
  'cvv',
]);

function sanitize(obj: unknown): Record<string, unknown> | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      result[key] = sanitize(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AdminAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    // Only log write methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const admin = request.admin as AdminUserDocument | undefined;
    if (!admin) {
      // If write is not from an authenticated admin, skip audit log
      return next.handle();
    }

    const auditMeta = this.reflector.getAllAndOverride<AuditActionMetadata | undefined>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const path = request.route?.path || request.url;
    const action = auditMeta?.action || `${method.toLowerCase()}:${path}`;
    const entityType = auditMeta?.entityType || request.params?.entity || 'resource';
    const entityId = request.params?.id || request.body?.id || request.body?._id || 'global';

    const before = sanitize(request.body?._before);
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      request.ip ||
      '127.0.0.1';
    const userAgent = (request.headers['user-agent'] as string) || 'unknown';

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const after = sanitize(request.body) || sanitize(responseBody);
          // Run asynchronously so response is not delayed
          this.auditService
            .createLog({
              actorAdminId: admin._id.toString(),
              actorEmail: admin.email,
              action,
              entityType,
              entityId: String(entityId),
              before,
              after,
              ip,
              userAgent,
            })
            .catch((err) => {
              this.logger.error(`Failed to record audit log: ${(err as Error).message}`);
            });
        },
      }),
    );
  }
}
