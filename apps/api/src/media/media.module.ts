import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service';
import { MuxService } from './mux.service';
import { MediaController } from './media.controller';
import { Lesson, LessonSchema, Enrollment, EnrollmentSchema } from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [CloudinaryService, MuxService],
  exports: [CloudinaryService, MuxService],
})
export class MediaModule {}
