import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushService } from './expo-push.service';
import { AdminPushController } from '../admin/notifications/admin-push.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController, AdminPushController],
  providers: [NotificationsService, ExpoPushService],
  exports: [NotificationsService, ExpoPushService],
})
export class NotificationsModule {}
