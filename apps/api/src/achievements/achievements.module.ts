import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Achievement,
  AchievementSchema,
  UserAchievement,
  UserAchievementSchema,
  User,
  UserSchema,
  PracticeAttempt,
  PracticeAttemptSchema,
  LessonProgress,
  LessonProgressSchema,
  Enrollment,
  EnrollmentSchema,
} from '../database/schemas';
import { PointsModule } from '../points/points.module';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: User.name, schema: UserSchema },
      { name: PracticeAttempt.name, schema: PracticeAttemptSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    forwardRef(() => PointsModule),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
