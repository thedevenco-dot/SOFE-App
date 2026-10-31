import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'auditAction';

export interface AuditActionMetadata {
  action: string;
  entityType: string;
}

export function AuditAction(action: string, entityType: string) {
  return SetMetadata(AUDIT_ACTION_KEY, { action, entityType } as AuditActionMetadata);
}
