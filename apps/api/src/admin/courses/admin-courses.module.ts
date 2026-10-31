import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminModule } from '../admin.module';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';

@Module({
  imports: [DatabaseModule, AdminModule],
  controllers: [AdminCoursesController],
  providers: [AdminCoursesService],
  exports: [AdminCoursesService],
})
export class AdminCoursesModule {}

