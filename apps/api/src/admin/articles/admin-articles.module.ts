import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Article,
  ArticleSchema,
  Author,
  AuthorSchema,
  ContentVersion,
  ContentVersionSchema,
  Topic,
  TopicSchema,
} from '../../database/schemas';
import { AdminModule } from '../admin.module';
import { AdminArticlesController } from './admin-articles.controller';
import { AdminArticlesService } from './admin-articles.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: ContentVersion.name, schema: ContentVersionSchema },
    ]),
    AdminModule,
  ],
  controllers: [AdminArticlesController],
  providers: [AdminArticlesService],
  exports: [AdminArticlesService],
})
export class AdminArticlesModule {}
