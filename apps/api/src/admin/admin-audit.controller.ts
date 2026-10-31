import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_PERMISSIONS } from '@sofe/shared';
import { AdminAuth } from '../common/decorators/admin-auth.decorator';
import { AdminAuditService, QueryAuditLogsDto } from './admin-audit.service';

@ApiTags('Admin Audit')
@Controller('admin')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @AdminAuth(ADMIN_PERMISSIONS.AUDIT_READ)
  @Get('audit-logs')
  @ApiOperation({ summary: 'List system audit logs (super_admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  async getAuditLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditService.findLogs(query);
  }
}
