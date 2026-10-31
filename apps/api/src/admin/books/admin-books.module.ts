import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema, CourseCategory, CourseCategorySchema } from '../../database/schemas';
import { AdminModule } from '../admin.module';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: CourseCategory.name, schema: CourseCategorySchema },
    ]),
    AdminModule,
  ],
  controllers: [AdminBooksController],
  providers: [AdminBooksService],
  exports: [AdminBooksService],
})
export class AdminBooksModule {}
