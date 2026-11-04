import { Controller, Get, Post, Param, Body, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ADMIN_PERMISSIONS,
  createPushCampaignSchema,
  sendTestPushSchema,
  type CreatePushCampaignDto,
  type SendTestPushDto,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationsService } from '../../notifications/notifications.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

@ApiTags('Admin Push Notifications')
@Controller('admin/push')
@UseInterceptors(AuditLogInterceptor)
export class AdminPushController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('campaigns')
  @AdminAuth(ADMIN_PERMISSIONS.PUSH_SEND)
  @ApiOperation({ summary: 'List push campaigns (CS29)' })
  @ApiResponse({ status: 200, description: 'Campaigns returned' })
  async listCampaigns(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notificationsService.listCampaigns(Number(page), Number(limit));
  }

  @Post('campaigns')
  @AdminAuth(ADMIN_PERMISSIONS.PUSH_SEND)
  @AuditAction('create', 'push_campaign')
  @ApiOperation({ summary: 'Create or schedule push campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async createCampaign(
    @CurrentAdmin() admin: AdminUserDocument,
    @Body(new ZodValidationPipe(createPushCampaignSchema)) dto: CreatePushCampaignDto,
  ) {
    const data = await this.notificationsService.createCampaign(admin._id.toString(), dto);
    return { data };
  }

  @Post('send-test')
  @AdminAuth(ADMIN_PERMISSIONS.PUSH_SEND)
  @ApiOperation({ summary: 'Send test push notification to admin device' })
  @ApiResponse({ status: 200, description: 'Test push sent' })
  async sendTestPush(
    @CurrentAdmin() admin: AdminUserDocument,
    @Body(new ZodValidationPipe(sendTestPushSchema)) dto: SendTestPushDto,
  ) {
    return this.notificationsService.sendTestPush(admin._id.toString(), dto.token, {
      title: dto.title,
      body: dto.body,
      deepLink: dto.deepLink,
    });
  }

  @Post('campaigns/:id/send')
  @AdminAuth(ADMIN_PERMISSIONS.PUSH_SEND)
  @AuditAction('send', 'push_campaign')
  @ApiOperation({ summary: 'Dispatch scheduled or draft push campaign' })
  @ApiResponse({ status: 200, description: 'Campaign dispatched' })
  async dispatchCampaign(@Param('id') id: string) {
    const data = await this.notificationsService.dispatchCampaign(id);
    return { data };
  }
}
