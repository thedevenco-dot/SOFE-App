import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema, Lesson, LessonSchema } from '../../database/schemas';
import { AdminModule } from '../admin.module';
import { AdminLessonsController } from './admin-lessons.controller';
import { AdminLessonsService } from './admin-lessons.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
    AdminModule,
  ],
  controllers: [AdminLessonsController],
  providers: [AdminLessonsService],
  exports: [AdminLessonsService],
})
export class AdminLessonsModule {}
