import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { type AdminPermission } from '@sofe/shared';
import { AdminAuthGuard } from '../guards/admin-auth.guard';

export const IS_ADMIN_AUTH_KEY = 'isAdminAuth';
export const ADMIN_PERMISSION_KEY = 'adminPermission';

export function AdminAuth(permission?: AdminPermission) {
  return applyDecorators(
    SetMetadata(IS_ADMIN_AUTH_KEY, true),
    SetMetadata(ADMIN_PERMISSION_KEY, permission),
    UseGuards(AdminAuthGuard),
    ApiBearerAuth('admin-auth'),
  );
}
