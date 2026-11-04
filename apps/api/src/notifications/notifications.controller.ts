import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  notificationQuerySchema,
  markNotificationsReadSchema,
  pushTokenSchema,
  deletePushTokenSchema,
  type NotificationQueryDto,
  type MarkNotificationsReadDto,
  type PushTokenDto,
  type DeletePushTokenDto,
} from '@sofe/shared';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';
import { UserDocument } from '../database/schemas/user.schema';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Auth()
  @Get()
  @ApiOperation({ summary: 'List in-app notifications for learner (HM7)' })
  @ApiResponse({ status: 200, description: 'Notifications returned successfully' })
  async list(
    @CurrentUser() user: UserDocument,
    @Query(new ZodValidationPipe(notificationQuerySchema)) query: NotificationQueryDto,
  ) {
    const res = await this.notificationsService.list(user._id.toString(), query);
    return {
      data: res.items,
      meta: {
        total: res.total,
        unreadCount: res.unreadCount,
        page: res.page,
        limit: res.limit,
        hasMore: res.hasMore,
      },
    };
  }

  @Auth()
  @Post('read')
  @ApiOperation({ summary: 'Mark notifications as read (batch or all)' })
  @ApiResponse({ status: 200, description: 'Marked as read successfully' })
  async markRead(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(markNotificationsReadSchema))
    body: MarkNotificationsReadDto,
  ) {
    return this.notificationsService.markRead(user._id.toString(), body);
  }

  @Auth()
  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread count returned' })
  async getUnreadCount(@CurrentUser() user: UserDocument) {
    const data = await this.notificationsService.getUnreadCount(user._id.toString());
    return { data };
  }

  @Auth()
  @Post('push-token')
  @ApiOperation({ summary: 'Register Expo push token' })
  @ApiResponse({ status: 200, description: 'Push token registered' })
  async registerPushToken(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(pushTokenSchema)) body: PushTokenDto,
  ) {
    return this.notificationsService.registerPushToken(user._id.toString(), body);
  }

  @Auth()
  @Delete('push-token')
  @ApiOperation({ summary: 'Deregister Expo push token on logout' })
  @ApiResponse({ status: 200, description: 'Push token deregistered' })
  async deregisterPushToken(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(deletePushTokenSchema)) body: DeletePushTokenDto,
  ) {
    return this.notificationsService.deregisterPushToken(user._id.toString(), body.token);
  }
}
