import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LearnerAuthGuard } from '../common/guards/learner-auth.guard';

@Module({
  imports: [DatabaseModule, FirebaseModule],
  controllers: [AuthController],
  providers: [AuthService, LearnerAuthGuard],
  exports: [AuthService, LearnerAuthGuard],
})
export class AuthModule {}
