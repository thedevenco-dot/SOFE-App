import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUser, AdminUserSchema } from '../database/schemas/admin-user.schema';
import { AuditLog, AuditLogSchema } from '../database/schemas/audit-log.schema';
import { FirebaseModule } from '../auth/firebase/firebase.module';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminAuditController } from './admin-audit.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [AdminAuthController, AdminAuditController],
  providers: [AdminAuthService, AdminAuditService, AdminAuthGuard, AuditLogInterceptor],
  exports: [AdminAuthService, AdminAuditService, AdminAuthGuard, AuditLogInterceptor],
})
export class AdminModule {}
