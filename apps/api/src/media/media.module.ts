import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service';
import { MuxService } from './mux.service';
import { MediaController } from './media.controller';
import {
  Lesson,
  LessonSchema,
  Enrollment,
  EnrollmentSchema,
  User,
  UserSchema,
  AdminUser,
  AdminUserSchema,
} from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [CloudinaryService, MuxService],
  exports: [CloudinaryService, MuxService],
})
export class MediaModule {}
