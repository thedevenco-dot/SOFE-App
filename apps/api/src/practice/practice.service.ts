import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  QUIZ_KINDS,
  QUIZ_STATUSES,
  PRACTICE_SLOT_KEYS,
  PRACTICE_REF_TYPES,
  POINTS_LEDGER_REASONS,
  type PracticeTodayResponse,
  type PracticeSlotDto,
} from '@sofe/shared';
import {
  PracticeSchedule,
  PracticeScheduleDocument,
  PracticeAttempt,
  PracticeAttemptDocument,
  Quiz,
  QuizDocument,
  DailyPlan,
  DailyPlanDocument,
  Reward,
  RewardDocument,
  ReflectionPrompt,
  ReflectionPromptDocument,
  GlobalPracticeSchedule,
  GlobalPracticeScheduleDocument,
} from '../database/schemas';
import { getDateKeyInTimezone } from '../home/home.service';
import { StreakService } from '../points/streak.service';
import { PointsService } from '../points/points.service';
import { QuizService } from './quiz.service';

@Injectable()
export class PracticeService {
  constructor(
    @InjectModel(PracticeSchedule.name)
    private readonly practiceScheduleModel: Model<PracticeScheduleDocument>,
    @InjectModel(PracticeAttempt.name)
    private readonly practiceAttemptModel: Model<PracticeAttemptDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(DailyPlan.name)
    @Optional()
    private readonly dailyPlanModel?: Model<DailyPlanDocument>,
    @InjectModel(Reward.name)
    @Optional()
    private readonly rewardModel?: Model<RewardDocument>,
    @InjectModel(ReflectionPrompt.name)
    @Optional()
    private readonly reflectionPromptModel?: Model<ReflectionPromptDocument>,
    @InjectModel(GlobalPracticeSchedule.name)
    @Optional()
    private readonly globalScheduleModel?: Model<GlobalPracticeScheduleDocument>,
    @Optional()
    private readonly quizService?: QuizService,
    @Optional()
    private readonly streakService?: StreakService,
    @Optional()
    private readonly pointsService?: PointsService,
  ) {}

  /**
   * Lazily initializes and fetches today's practice schedule for the user's timezone.
   * Includes streak status and today's featured Quick Quiz (sanitized public view).
   */
  async getTodayPractice(userId: string, tz?: string): Promise<PracticeTodayResponse> {
    const { dateKey } = getDateKeyInTimezone(tz);
    const uId = new Types.ObjectId(userId);

    // Find the latest published quick quiz
    const quickQuizDoc = await this.quizModel
      .findOne({
        kind: QUIZ_KINDS.QUICK_QUIZ,
        status: QUIZ_STATUSES.PUBLISHED,
      })
      .sort({ createdAt: -1 });

    const defaultSlots: PracticeSlotDto[] = [
      {
        slotKey: PRACTICE_SLOT_KEYS.QUICK_QUIZ,
        title: quickQuizDoc?.title || 'Rapid Decision Scenario',
        refType: PRACTICE_REF_TYPES.QUIZ,
        refId: quickQuizDoc?._id?.toString(),
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.BRAIN_GAME,
        title: 'Cognitive Agility Sprint',
        refType: PRACTICE_REF_TYPES.GAME,
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.SCENARIO_CHALLENGE,
        title: 'Tactical Negotiation Drill',
        refType: PRACTICE_REF_TYPES.CHALLENGE,
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.MATCH_CONCEPT,
        title: 'Mental Models Alignment',
        refType: PRACTICE_REF_TYPES.GAME,
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.DAILY_REFLECTION,
        title: 'Executive Synthesis Note',
        refType: PRACTICE_REF_TYPES.PROMPT,
        done: false,
      },
    ];

    let schedule = await this.practiceScheduleModel.findOne({
      userId: uId,
      dateKey,
    });

    if (!schedule) {
      schedule = await this.practiceScheduleModel.findOneAndUpdate(
        { userId: uId, dateKey },
        {
          $setOnInsert: {
            userId: uId,
            dateKey,
            slots: defaultSlots,
            completedCount: 0,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (!schedule) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Failed to initialize practice schedule',
      });
    }

    // Retrieve streak info
    const streakStatus = this.streakService
      ? await this.streakService.getStreakStatus(userId, tz).catch(() => null)
      : null;

    // Public view of Quick Quiz
    const publicQuiz =
      quickQuizDoc && this.quizService
        ? await this.quizService.getPublicQuiz(quickQuizDoc._id.toString()).catch(() => null)
        : null;

    return {
      dateKey,
      schedule: {
        id: schedule._id.toString(),
        userId: schedule.userId.toString(),
        dateKey: schedule.dateKey,
        slots: schedule.slots.map((s) => ({
          slotKey: s.slotKey,
          title: s.title,
          refType: s.refType,
          refId: s.refId,
          done: s.done,
          score: s.score,
        })),
        completedCount: schedule.completedCount,
        totalCount: schedule.slots.length,
      },
      streak: {
        current: streakStatus?.current || 0,
        longest: streakStatus?.longest || 0,
        isActiveToday: streakStatus?.isActiveToday || false,
      },
      quickQuiz: publicQuiz,
    };
  }

  /**
   * Retrieves user's practice attempt history with quiz metadata.
   */
  async getPracticeHistory(userId: string, limit = 20) {
    const uId = new Types.ObjectId(userId);
    const attempts = await this.practiceAttemptModel
      .find({ userId: uId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .populate('quizId', 'title kind passingScorePercent')
      .lean();

    return attempts.map((a) => {
      const quiz = a.quizId as unknown as { _id?: Types.ObjectId; title?: string; kind?: string };
      return {
        id: a._id.toString(),
        quizId: quiz?._id ? quiz._id.toString() : a.quizId?.toString(),
        quizTitle: quiz?.title || 'Practice Quiz',
        quizKind: quiz?.kind || 'quick_quiz',
        score: a.score,
        passed: a.passed,
        pointsAwarded: a.pointsAwarded,
        completedAt: (a.completedAt || a.createdAt || new Date()).toISOString(),
      };
    });
  }

  /**
   * Retrieves today's reflection prompt for the learner.
   */
  async getTodayReflection(tz?: string) {
    const { dateKey } = getDateKeyInTimezone(tz);

    if (this.globalScheduleModel && this.reflectionPromptModel) {
      const globalSchedule = await this.globalScheduleModel.findOne({ dateKey });
      const reflectionSlot = globalSchedule?.slots?.find(
        (s) => s.slotKey === PRACTICE_SLOT_KEYS.DAILY_REFLECTION,
      );

      if (reflectionSlot?.refId && Types.ObjectId.isValid(reflectionSlot.refId)) {
        const promptDoc = await this.reflectionPromptModel.findById(reflectionSlot.refId);
        if (promptDoc) {
          return {
            id: promptDoc._id.toString(),
            prompt: promptDoc.prompt,
            category: promptDoc.category,
            dateKey,
          };
        }
      }

      // If not in schedule, pick latest active prompt
      const promptDoc = await this.reflectionPromptModel
        .findOne({ active: true })
        .sort({ createdAt: -1 });
      if (promptDoc) {
        return {
          id: promptDoc._id.toString(),
          prompt: promptDoc.prompt,
          category: promptDoc.category,
          dateKey,
        };
      }
    }

    // Default thoughtful founder synthesis prompt
    return {
      id: 'default_reflection',
      prompt:
        'What was your most critical strategic decision today and what cognitive bias might have influenced it?',
      category: 'strategy',
      dateKey,
    };
  }

  /**
   * Records learner's daily reflection synthesis, marks slot done, and awards points.
   */
  async submitReflection(
    userId: string,
    dto: { responseText: string; promptId?: string },
    tz?: string,
  ) {
    if (!dto.responseText || !dto.responseText.trim()) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Reflection response cannot be empty',
      });
    }

    const { dateKey } = getDateKeyInTimezone(tz);
    const uId = new Types.ObjectId(userId);
    const pointsAwarded = 20;

    // Mark daily_reflection slot as done in user's practice schedule
    await this.practiceScheduleModel
      .findOneAndUpdate(
        { userId: uId, dateKey, 'slots.slotKey': PRACTICE_SLOT_KEYS.DAILY_REFLECTION },
        {
          $set: {
            'slots.$.done': true,
          },
        },
      )
      .catch(() => null);

    // Recalculate completedCount
    const schedule = await this.practiceScheduleModel.findOne({ userId: uId, dateKey });
    if (schedule) {
      schedule.completedCount = schedule.slots.filter((s) => s.done).length;
      await schedule.save().catch(() => null);
    }

    // Award points idempotently
    if (this.pointsService) {
      await this.pointsService
        .awardPoints({
          userId,
          amount: pointsAwarded,
          reason: POINTS_LEDGER_REASONS.REFLECTION,
          idempotencyKey: `reflection:${userId}:${dateKey}`,
          note: 'Completed Daily Executive Reflection',
        })
        .catch(() => null);
    }

    // Update streak activity
    if (this.streakService) {
      await this.streakService
        .recordActivity(userId, tz || 'UTC', undefined, 1, pointsAwarded)
        .catch(() => null);
    }

    // Mark DailyPlan item 'reflect' as done if present
    if (this.dailyPlanModel) {
      const plan = await this.dailyPlanModel.findOne({ userId: uId, dateKey });
      if (plan) {
        const reflectItem = plan.items.find((item) => item.key === 'reflect');
        if (reflectItem && !reflectItem.done) {
          reflectItem.done = true;
          reflectItem.doneAt = new Date();
          plan.completedCount = plan.items.filter((i) => i.done).length;
          await plan.save().catch(() => null);
        }
      }
    }

    return {
      success: true,
      pointsAwarded,
      done: true,
      dateKey,
    };
  }

  /**
   * Retrieves active rewards catalogue for learners.
   */
  async getLearnerRewards() {
    if (!this.rewardModel) return [];

    const rewards = await this.rewardModel
      .find({ status: 'active' })
      .sort({ costPoints: 1 })
      .lean();

    return rewards.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      description: r.description,
      type: r.type,
      costPoints: r.costPoints,
      pointsCost: r.costPoints,
      stock: r.stock,
      status: r.status,
    }));
  }

  /**
   * Redeems a reward for the learner.
   */
  async redeemReward(userId: string, rewardId: string) {
    if (!Types.ObjectId.isValid(rewardId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    if (!this.rewardModel || !this.pointsService) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Redemption service unavailable',
      });
    }

    const reward = await this.rewardModel.findById(rewardId);
    if (!reward || reward.status !== 'active') {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found or no longer active',
      });
    }

    if (
      reward.stock !== null &&
      reward.stock !== undefined &&
      reward.stock !== -1 &&
      reward.stock <= 0
    ) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'This reward is currently out of stock',
      });
    }

    const cost = reward.costPoints;
    const balanceData = await this.pointsService.getPointsBalance(userId);
    const currentPoints = balanceData.pointsBalance;
    if (currentPoints < cost) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: `Insufficient points. You need ${cost} pts but have ${currentPoints} pts.`,
      });
    }

    // Deduct points via PointsService
    await this.pointsService.awardPoints({
      userId,
      amount: -cost,
      reason: POINTS_LEDGER_REASONS.REDEEM,
      idempotencyKey: `redeem:${userId}:${rewardId}:${Date.now()}`,
      note: `Redeemed: ${reward.title}`,
    });

    // Decrement stock if finite
    if (reward.stock && reward.stock > 0) {
      reward.stock -= 1;
      await reward.save();
    }

    return {
      success: true,
      reward: {
        id: reward._id.toString(),
        title: reward.title,
        type: reward.type,
        costPoints: cost,
        pointsCost: cost,
      },
      remainingBalance: currentPoints - cost,
    };
  }
}
