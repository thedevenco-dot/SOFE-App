import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Quiz,
  QuizSchema,
  Reward,
  RewardSchema,
  GlobalPracticeSchedule,
  GlobalPracticeScheduleSchema,
  ReflectionPrompt,
  ReflectionPromptSchema,
  Quote,
  QuoteSchema,
  Word,
  WordSchema,
  AppConfig,
  AppConfigSchema,
} from '../../database/schemas';
import { AdminModule } from '../admin.module';
import { PointsModule } from '../../points/points.module';

import { AdminQuizzesService } from './admin-quizzes.service';
import { AdminQuizzesController } from './admin-quizzes.controller';

import { AdminPracticeScheduleService } from './admin-practice-schedule.service';
import { AdminPracticeScheduleController } from './admin-practice-schedule.controller';

import { AdminPointsService } from './admin-points.service';
import { AdminPointsController } from './admin-points.controller';

import { AdminRewardsService } from './admin-rewards.service';
import { AdminRewardsController } from './admin-rewards.controller';

import { AdminQuotesPromptsService } from './admin-quotes-prompts.service';
import { AdminQuotesPromptsController } from './admin-quotes-prompts.controller';
import { AdminAchievementsController } from './admin-achievements.controller';
import { AchievementsModule } from '../../achievements/achievements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: GlobalPracticeSchedule.name, schema: GlobalPracticeScheduleSchema },
      { name: ReflectionPrompt.name, schema: ReflectionPromptSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Word.name, schema: WordSchema },
      { name: AppConfig.name, schema: AppConfigSchema },
    ]),
    AdminModule,
    PointsModule,
    AchievementsModule,
  ],
  controllers: [
    AdminQuizzesController,
    AdminPracticeScheduleController,
    AdminPointsController,
    AdminRewardsController,
    AdminQuotesPromptsController,
    AdminAchievementsController,
  ],
  providers: [
    AdminQuizzesService,
    AdminPracticeScheduleService,
    AdminPointsService,
    AdminRewardsService,
    AdminQuotesPromptsService,
  ],
  exports: [
    AdminQuizzesService,
    AdminPracticeScheduleService,
    AdminPointsService,
    AdminRewardsService,
    AdminQuotesPromptsService,
  ],
})
export class AdminPracticeModule {}
