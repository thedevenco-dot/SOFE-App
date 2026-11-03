import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Course,
  CourseSchema,
  Enrollment,
  EnrollmentSchema,
  Lesson,
  LessonProgress,
  LessonProgressSchema,
  LessonSchema,
  User,
  UserSchema,
} from '../database/schemas';
import { MediaModule } from '../media/media.module';
import { AuthModule } from '../auth/auth.module';
import { EnrollmentsController } from './enrollments.controller';
import { LearningCoursesController } from './learning-courses.controller';
import { LessonsController } from './lessons.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MediaModule,
    AuthModule,
  ],
  controllers: [EnrollmentsController, LearningCoursesController, LessonsController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
