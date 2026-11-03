import { Controller, Get, Put, Post, Body, Req, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ADMIN_PERMISSIONS, type PointsRulesDto, type AdminAdjustPointsDto } from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AdminPointsService } from './admin-points.service';

interface RequestWithIp {
  ip?: string;
  headers?: Record<string, string>;
}

@ApiTags('Admin Points')
@Controller('admin/points')
@UseInterceptors(AuditLogInterceptor)
export class AdminPointsController {
  constructor(private readonly pointsService: AdminPointsService) {}

  @Get('rules')
  @AdminAuth(ADMIN_PERMISSIONS.USER_READ)
  @ApiOperation({ summary: 'Get active points calculation rules' })
  @ApiResponse({ status: 200, description: 'Points rules' })
  async getPointsRules() {
    return this.pointsService.getPointsRules();
  }

  @Put('rules')
  @AdminAuth(ADMIN_PERMISSIONS.ORDER_MANUAL)
  @AuditAction('update', 'points_rules')
  @ApiOperation({ summary: 'Update points calculation rules' })
  @ApiResponse({ status: 200, description: 'Points rules updated' })
  async updatePointsRules(
    @Body() dto: PointsRulesDto,
    @CurrentAdmin() admin?: AdminUserDocument,
    @Req() req?: RequestWithIp,
  ) {
    const adminId = admin?._id?.toString();
    const adminEmail = admin?.email || 'admin@sofe.io';
    const ip = req?.ip || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'admin-ui';
    return this.pointsService.updatePointsRules(dto, adminId, adminEmail, ip, userAgent);
  }

  @Post('adjust')
  @AdminAuth(ADMIN_PERMISSIONS.ORDER_MANUAL)
  @AuditAction('adjust', 'user_points')
  @ApiOperation({ summary: 'Manually credit or debit user points' })
  @ApiResponse({ status: 200, description: 'Points adjusted' })
  async adjustPoints(
    @Body() dto: AdminAdjustPointsDto,
    @CurrentAdmin() admin?: AdminUserDocument,
    @Req() req?: RequestWithIp,
  ) {
    const adminId = admin?._id?.toString();
    const adminEmail = admin?.email || 'admin@sofe.io';
    const ip = req?.ip || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'admin-ui';
    return this.pointsService.adjustUserPoints(dto, adminId, adminEmail, ip, userAgent);
  }
}
