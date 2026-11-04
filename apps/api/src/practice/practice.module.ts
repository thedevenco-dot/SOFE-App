import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Quiz,
  QuizSchema,
  PracticeAttempt,
  PracticeAttemptSchema,
  PracticeSchedule,
  PracticeScheduleSchema,
  DailyPlan,
  DailyPlanSchema,
  Reward,
  RewardSchema,
  ReflectionPrompt,
  ReflectionPromptSchema,
  GlobalPracticeSchedule,
  GlobalPracticeScheduleSchema,
} from '../database/schemas';
import { PointsModule } from '../points/points.module';
import { QuizService } from './quiz.service';
import { PracticeService } from './practice.service';
import { QuizzesController } from './quizzes.controller';
import { PractiseController } from './practise.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: PracticeAttempt.name, schema: PracticeAttemptSchema },
      { name: PracticeSchedule.name, schema: PracticeScheduleSchema },
      { name: DailyPlan.name, schema: DailyPlanSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: ReflectionPrompt.name, schema: ReflectionPromptSchema },
      { name: GlobalPracticeSchedule.name, schema: GlobalPracticeScheduleSchema },
    ]),
    PointsModule,
  ],
  controllers: [QuizzesController, PractiseController],
  providers: [QuizService, PracticeService],
  exports: [QuizService, PracticeService],
})
export class PracticeModule {}
