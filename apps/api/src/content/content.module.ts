import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Article,
  ArticleSchema,
  Author,
  AuthorSchema,
  Book,
  BookSchema,
  Course,
  CourseCategory,
  CourseCategorySchema,
  CourseSchema,
  Lesson,
  LessonSchema,
  Topic,
  TopicSchema,
  Video,
  VideoSchema,
} from '../database/schemas';
import { ArticlesController } from './articles.controller';
import { AuthorsController } from './authors.controller';
import { BooksController } from './books.controller';
import { ContentService } from './content.service';
import { CoursesController } from './courses.controller';
import { SearchController } from './search.controller';
import { TopicsController } from './topics.controller';
import { VideosController } from './videos.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseCategory.name, schema: CourseCategorySchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Book.name, schema: BookSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
  ],
  controllers: [
    CoursesController,
    ArticlesController,
    TopicsController,
    AuthorsController,
    BooksController,
    VideosController,
    SearchController,
  ],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
