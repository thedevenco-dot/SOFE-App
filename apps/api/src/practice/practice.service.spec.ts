import { Types, Model } from 'mongoose';
import { PracticeService } from './practice.service';
import { PRACTICE_SLOT_KEYS, QUIZ_KINDS, QUIZ_STATUSES } from '@sofe/shared';
import {
  PracticeScheduleDocument,
  PracticeAttemptDocument,
  QuizDocument,
  DailyPlanDocument,
  RewardDocument,
  ReflectionPromptDocument,
  GlobalPracticeScheduleDocument,
} from '../database/schemas';
import { QuizService } from './quiz.service';
import { StreakService } from '../points/streak.service';
import { PointsService } from '../points/points.service';

describe('PracticeService (Task T3.4 & T3.6)', () => {
  let service: PracticeService;
  let mockPracticeScheduleModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let mockPracticeAttemptModel: {
    find: jest.Mock;
  };
  let mockQuizModel: {
    findOne: jest.Mock;
  };
  let mockDailyPlanModel: {
    findOne: jest.Mock;
  };
  let mockRewardModel: {
    find: jest.Mock;
    findById: jest.Mock;
  };
  let mockReflectionPromptModel: {
    findById: jest.Mock;
    findOne: jest.Mock;
  };
  let mockGlobalScheduleModel: {
    findOne: jest.Mock;
  };
  let mockQuizService: {
    getPublicQuiz: jest.Mock;
  };
  let mockStreakService: {
    getStreakStatus: jest.Mock;
    recordActivity: jest.Mock;
  };
  let mockPointsService: {
    awardPoints: jest.Mock;
    getPointsBalance: jest.Mock;
  };

  const mockUserId = new Types.ObjectId().toHexString();
  const mockQuizId = new Types.ObjectId();

  const mockQuickQuizDoc = {
    _id: mockQuizId,
    title: 'Product Strategy Calibration',
    kind: QUIZ_KINDS.QUICK_QUIZ,
    status: QUIZ_STATUSES.PUBLISHED,
  };

  const mockScheduleDoc = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(mockUserId),
    dateKey: '2026-11-03',
    slots: [
      {
        slotKey: PRACTICE_SLOT_KEYS.QUICK_QUIZ,
        title: 'Product Strategy Calibration',
        refType: 'quiz',
        refId: mockQuizId.toHexString(),
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.BRAIN_GAME,
        title: 'Cognitive Agility Sprint',
        refType: 'game',
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.SCENARIO_CHALLENGE,
        title: 'Tactical Negotiation Drill',
        refType: 'challenge',
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.MATCH_CONCEPT,
        title: 'Mental Models Alignment',
        refType: 'game',
        done: false,
      },
      {
        slotKey: PRACTICE_SLOT_KEYS.DAILY_REFLECTION,
        title: 'Executive Synthesis Note',
        refType: 'prompt',
        done: false,
      },
    ],
    completedCount: 0,
  };

  beforeEach(() => {
    mockPracticeScheduleModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn().mockResolvedValue(mockScheduleDoc),
    };
    mockPracticeAttemptModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: new Types.ObjectId(),
                  quizId: {
                    _id: mockQuizId,
                    title: 'Product Strategy Calibration',
                    kind: 'quick_quiz',
                  },
                  score: 100,
                  passed: true,
                  pointsAwarded: 50,
                  completedAt: new Date('2026-11-03T10:00:00Z'),
                },
              ]),
            }),
          }),
        }),
      }),
    };
    mockQuizModel = {
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockQuickQuizDoc),
      }),
    };
    mockQuizService = {
      getPublicQuiz: jest.fn().mockResolvedValue({
        id: mockQuizId.toHexString(),
        title: 'Product Strategy Calibration',
        kind: 'quick_quiz',
        passingScorePercent: 80,
        questionCount: 3,
        questions: [],
      }),
    };
    mockStreakService = {
      getStreakStatus: jest.fn().mockResolvedValue({
        current: 5,
        longest: 12,
        isActiveToday: true,
      }),
      recordActivity: jest.fn().mockResolvedValue({ current: 6 }),
    };
    mockDailyPlanModel = {
      findOne: jest.fn().mockResolvedValue({
        items: [{ key: 'reflect', done: false }],
        completedCount: 0,
        save: jest.fn().mockResolvedValue(true),
      }),
    };
    mockRewardModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              title: 'Free Strategy Course',
              type: 'course_access',
              costPoints: 500,
              pointsCost: 500,
              stock: 10,
              status: 'active',
            },
          ]),
        }),
      }),
      findById: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        title: 'Free Strategy Course',
        type: 'course_access',
        costPoints: 500,
        pointsCost: 500,
        stock: 10,
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
      }),
    };
    mockReflectionPromptModel = {
      findById: jest.fn(),
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          prompt: 'What was your biggest insight today?',
          category: 'strategy',
        }),
      }),
    };
    mockGlobalScheduleModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    mockPointsService = {
      awardPoints: jest.fn().mockResolvedValue({ balance: 600 }),
      getPointsBalance: jest.fn().mockResolvedValue({ pointsBalance: 1000 }),
    };

    service = new PracticeService(
      mockPracticeScheduleModel as unknown as Model<PracticeScheduleDocument>,
      mockPracticeAttemptModel as unknown as Model<PracticeAttemptDocument>,
      mockQuizModel as unknown as Model<QuizDocument>,
      mockDailyPlanModel as unknown as Model<DailyPlanDocument>,
      mockRewardModel as unknown as Model<RewardDocument>,
      mockReflectionPromptModel as unknown as Model<ReflectionPromptDocument>,
      mockGlobalScheduleModel as unknown as Model<GlobalPracticeScheduleDocument>,
      mockQuizService as unknown as QuizService,
      mockStreakService as unknown as StreakService,
      mockPointsService as unknown as PointsService,
    );
  });

  describe('getTodayPractice', () => {
    it('creates schedule with 5 practice slots if none exists for today', async () => {
      mockPracticeScheduleModel.findOne.mockResolvedValue(null);

      const res = await service.getTodayPractice(mockUserId, 'UTC');

      expect(mockPracticeScheduleModel.findOneAndUpdate).toHaveBeenCalled();
      expect(res.schedule.slots.length).toBe(5);
      expect(res.schedule.slots[0].slotKey).toBe(PRACTICE_SLOT_KEYS.QUICK_QUIZ);
      expect(res.streak.current).toBe(5);
      expect(res.quickQuiz).toBeDefined();
      expect(res.quickQuiz?.id).toBe(mockQuizId.toHexString());
    });

    it('returns existing schedule if already created', async () => {
      mockPracticeScheduleModel.findOne.mockResolvedValue(mockScheduleDoc);

      const res = await service.getTodayPractice(mockUserId, 'UTC');

      expect(res.schedule.id).toBe(mockScheduleDoc._id.toString());
      expect(mockPracticeScheduleModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getPracticeHistory', () => {
    it('returns mapped attempt history for user', async () => {
      const history = await service.getPracticeHistory(mockUserId, 10);
      expect(history.length).toBe(1);
      expect(history[0].quizTitle).toBe('Product Strategy Calibration');
      expect(history[0].score).toBe(100);
      expect(history[0].passed).toBe(true);
    });
  });

  describe('getTodayReflection & submitReflection', () => {
    it('returns active reflection prompt or fallback', async () => {
      const prompt = await service.getTodayReflection('UTC');
      expect(prompt).toBeDefined();
      expect(prompt.prompt).toContain('insight');
    });

    it('submits reflection, marks slot done, and awards 20 points', async () => {
      const result = await service.submitReflection(
        mockUserId,
        { responseText: 'Today I realized customer retention is more important than raw signups.' },
        'UTC',
      );

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(20);
      expect(mockPracticeScheduleModel.findOneAndUpdate).toHaveBeenCalled();
      expect(mockPointsService.awardPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          amount: 20,
          reason: 'reflection',
        }),
      );
      expect(mockStreakService.recordActivity).toHaveBeenCalledWith(
        mockUserId,
        'UTC',
        undefined,
        1,
        20,
      );
    });

    it('rejects empty reflection submission', async () => {
      await expect(service.submitReflection(mockUserId, { responseText: '   ' })).rejects.toThrow();
    });
  });

  describe('getLearnerRewards & redeemReward', () => {
    it('returns active rewards list', async () => {
      const rewards = await service.getLearnerRewards();
      expect(rewards.length).toBe(1);
      expect(rewards[0].title).toBe('Free Strategy Course');
    });

    it('redeems reward when learner has sufficient points balance', async () => {
      const rewardId = new Types.ObjectId().toHexString();
      const res = await service.redeemReward(mockUserId, rewardId);

      expect(res.success).toBe(true);
      expect(res.remainingBalance).toBe(500); // 1000 - 500
      expect(mockPointsService.awardPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          amount: -500,
          reason: 'redeem',
        }),
      );
    });

    it('throws error if learner points balance is insufficient', async () => {
      mockPointsService.getPointsBalance.mockResolvedValueOnce({ pointsBalance: 200 });
      const rewardId = new Types.ObjectId().toHexString();

      await expect(service.redeemReward(mockUserId, rewardId)).rejects.toThrow(
        /Insufficient points/,
      );
    });
  });
});
