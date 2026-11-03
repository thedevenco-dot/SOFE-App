import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  QUIZ_KINDS,
  QUIZ_STATUSES,
  PRACTICE_SLOT_KEYS,
  PRACTICE_REF_TYPES,
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
} from '../database/schemas';
import { getDateKeyInTimezone } from '../home/home.service';
import { StreakService } from '../points/streak.service';
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
    private readonly quizService: QuizService,
    @Optional()
    private readonly streakService?: StreakService,
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
    const publicQuiz = quickQuizDoc
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
}
