import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
  Enrollment,
  EnrollmentSchema,
  LessonProgress,
  LessonProgressSchema,
  PracticeAttempt,
  PracticeAttemptSchema,
  Achievement,
  AchievementSchema,
  UserAchievement,
  UserAchievementSchema,
  Project,
  ProjectSchema,
} from '../database/schemas';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { PublicUsersController } from './public-users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: PracticeAttempt.name, schema: PracticeAttemptSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [UsersController, PublicUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
