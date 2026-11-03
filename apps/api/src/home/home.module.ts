import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VisionBoardItem,
  VisionBoardItemSchema,
  DailyPlan,
  DailyPlanSchema,
  Quote,
  QuoteSchema,
  Word,
  WordSchema,
  Article,
  ArticleSchema,
  User,
  UserSchema,
} from '../database/schemas';
import { LearningModule } from '../learning/learning.module';
import { AuthModule } from '../auth/auth.module';
import { PointsModule } from '../points/points.module';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisionBoardItem.name, schema: VisionBoardItemSchema },
      { name: DailyPlan.name, schema: DailyPlanSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Word.name, schema: WordSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LearningModule,
    AuthModule,
    PointsModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
