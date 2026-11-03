import { Types, Model } from 'mongoose';
import { AdminPracticeScheduleService } from './admin-practice-schedule.service';
import { AdminPointsService } from './admin-points.service';
import { AdminRewardsService } from './admin-rewards.service';
import { AdminQuotesPromptsService } from './admin-quotes-prompts.service';
import { REWARD_TYPES, PRACTICE_SLOT_KEYS, PRACTICE_REF_TYPES } from '@sofe/shared';
import {
  GlobalPracticeScheduleDocument,
  QuizDocument,
  ReflectionPromptDocument,
  AppConfigDocument,
  RewardDocument,
  QuoteDocument,
  WordDocument,
} from '../../database/schemas';
import { PointsService } from '../../points/points.service';
import { AdminAuditService } from '../admin-audit.service';

describe('Admin Practice & Rewards Services (Task T3.5)', () => {
  describe('AdminPracticeScheduleService', () => {
    let service: AdminPracticeScheduleService;
    let mockScheduleModel: {
      find: jest.Mock;
      findOneAndUpdate: jest.Mock;
    };
    let mockQuizModel: {
      find: jest.Mock;
    };
    let mockPromptModel: {
      find: jest.Mock;
    };

    const mockScheduleDoc = {
      _id: new Types.ObjectId(),
      dateKey: '2026-11-04',
      slots: [
        {
          slotKey: PRACTICE_SLOT_KEYS.QUICK_QUIZ,
          title: 'Quiz',
          refType: PRACTICE_REF_TYPES.QUIZ,
          done: false,
        },
      ],
    };

    beforeEach(() => {
      mockScheduleModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockScheduleDoc]),
          }),
          lean: jest.fn().mockResolvedValue([mockScheduleDoc]),
        }),
        findOneAndUpdate: jest.fn().mockResolvedValue(mockScheduleDoc),
      };
      mockQuizModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId(), title: 'Q' }]),
            }),
          }),
        }),
      };
      mockPromptModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId(), prompt: 'P' }]),
            }),
          }),
        }),
      };

      service = new AdminPracticeScheduleService(
        mockScheduleModel as unknown as Model<GlobalPracticeScheduleDocument>,
        mockQuizModel as unknown as Model<QuizDocument>,
        mockPromptModel as unknown as Model<ReflectionPromptDocument>,
      );
    });

    it('getSchedule detects unassigned dates in next 7 days', async () => {
      const res = await service.getSchedule('2026-11-04', '2026-11-18');
      expect(res.schedules.length).toBe(1);
      expect(Array.isArray(res.unassignedFutureDates)).toBe(true);
    });

    it('setScheduleForDate updates date slots', async () => {
      const res = await service.setScheduleForDate('2026-11-05', [
        {
          slotKey: PRACTICE_SLOT_KEYS.BRAIN_GAME,
          title: 'Game',
          refType: PRACTICE_REF_TYPES.GAME,
          done: false,
        },
      ]);
      expect(mockScheduleModel.findOneAndUpdate).toHaveBeenCalled();
      expect(res.dateKey).toBe('2026-11-04');
    });
  });

  describe('AdminPointsService', () => {
    let service: AdminPointsService;
    let mockAppConfigModel: {
      findOne: jest.Mock;
      findOneAndUpdate: jest.Mock;
    };
    let mockPointsService: {
      awardPoints: jest.Mock;
    };
    let mockAuditService: {
      createLog: jest.Mock;
    };

    beforeEach(() => {
      mockAppConfigModel = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            value: { quizPoints: 60 },
          }),
        }),
        findOneAndUpdate: jest.fn().mockResolvedValue({}),
      };
      mockPointsService = {
        awardPoints: jest.fn().mockResolvedValue({ balanceAfter: 150 }),
      };
      mockAuditService = {
        createLog: jest.fn().mockResolvedValue({}),
      };

      service = new AdminPointsService(
        mockAppConfigModel as unknown as Model<AppConfigDocument>,
        mockPointsService as unknown as PointsService,
        mockAuditService as unknown as AdminAuditService,
      );
    });

    it('getPointsRules returns active rules merged with defaults', async () => {
      const rules = await service.getPointsRules();
      expect(rules.quizPoints).toBe(60);
      expect(rules.dailyStreakBonus).toBe(50);
    });

    it('updatePointsRules saves rules and writes audit log', async () => {
      const updated = await service.updatePointsRules(
        {
          quizPoints: 75,
          lessonPoints: 30,
          dailyStreakBonus: 50,
          maxDailyPoints: 600,
          freeCourseCost: 500,
        },
        'admin_1',
      );
      expect(updated.quizPoints).toBe(75);
      expect(mockAuditService.createLog).toHaveBeenCalled();
    });

    it('adjustUserPoints awards points and writes audit log', async () => {
      const res = await service.adjustUserPoints(
        { userId: 'u1', amount: 50, note: 'Manual reward', reason: 'admin_adjust' },
        'admin_1',
      );
      expect(res.balanceAfter).toBe(150);
      expect(mockPointsService.awardPoints).toHaveBeenCalled();
      expect(mockAuditService.createLog).toHaveBeenCalled();
    });
  });

  describe('AdminRewardsService', () => {
    let service: AdminRewardsService;
    let mockRewardModel: {
      find: jest.Mock;
      findById: jest.Mock;
      create: jest.Mock;
      findByIdAndUpdate: jest.Mock;
      deleteOne: jest.Mock;
    };

    const mockRewardId = new Types.ObjectId();
    const mockRewardDoc = {
      _id: mockRewardId,
      title: 'Free Strategy Course',
      description: 'Access to course',
      type: REWARD_TYPES.COURSE_ACCESS,
      costPoints: 500,
      status: 'active',
    };

    beforeEach(() => {
      mockRewardModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockRewardDoc]),
            }),
          }),
        }),
        findById: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRewardDoc),
          }),
        }),
        create: jest.fn().mockResolvedValue(mockRewardDoc),
        findByIdAndUpdate: jest.fn().mockResolvedValue(mockRewardDoc),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      service = new AdminRewardsService(mockRewardModel as unknown as Model<RewardDocument>);
    });

    it('listRewards returns active rewards', async () => {
      const res = await service.listRewards('active');
      expect(res.length).toBe(1);
      expect(res[0].title).toBe('Free Strategy Course');
    });

    it('createReward stores reward item', async () => {
      const res = await service.createReward({
        title: 'Discount Coupon',
        description: '10% off',
        type: REWARD_TYPES.COUPON,
        costPoints: 200,
        couponCode: 'OFF10',
        status: 'active',
      });
      expect(res.title).toBe('Free Strategy Course');
      expect(mockRewardModel.create).toHaveBeenCalled();
    });
  });

  describe('AdminQuotesPromptsService', () => {
    let service: AdminQuotesPromptsService;
    let mockQuoteModel: {
      find: jest.Mock;
      create: jest.Mock;
      findByIdAndUpdate: jest.Mock;
      deleteOne: jest.Mock;
    };
    let mockWordModel: {
      find: jest.Mock;
      create: jest.Mock;
      findByIdAndUpdate: jest.Mock;
      deleteOne: jest.Mock;
    };
    let mockPromptModel: {
      find: jest.Mock;
      create: jest.Mock;
      findByIdAndUpdate: jest.Mock;
      deleteOne: jest.Mock;
    };

    const mockId = new Types.ObjectId();

    beforeEach(() => {
      mockQuoteModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: mockId, text: 'Stay focused' }]),
          }),
        }),
        create: jest
          .fn()
          .mockResolvedValue({ _id: mockId, text: 'Stay focused', status: 'published' }),
        findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: mockId, text: 'Updated' }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };
      mockWordModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: mockId, word: 'TENACITY' }]),
          }),
        }),
        create: jest.fn().mockResolvedValue({ _id: mockId, word: 'TENACITY', status: 'published' }),
        findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: mockId, word: 'TENACITY' }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };
      mockPromptModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: mockId, prompt: 'What worked today?' }]),
          }),
        }),
        create: jest
          .fn()
          .mockResolvedValue({ _id: mockId, prompt: 'What worked today?', active: true }),
        findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: mockId, prompt: 'Updated' }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      service = new AdminQuotesPromptsService(
        mockQuoteModel as unknown as Model<QuoteDocument>,
        mockWordModel as unknown as Model<WordDocument>,
        mockPromptModel as unknown as Model<ReflectionPromptDocument>,
      );
    });

    it('manages quotes CRUD', async () => {
      const list = await service.listQuotes();
      expect(list.length).toBe(1);
      const created = await service.createQuote({ text: 'New quote' });
      expect(created.text).toBe('Stay focused');
    });

    it('manages words CRUD', async () => {
      const list = await service.listWords();
      expect(list.length).toBe(1);
      const created = await service.createWord({ word: 'resilience' });
      expect(created.word).toBe('TENACITY');
    });

    it('manages reflection prompts CRUD', async () => {
      const list = await service.listPrompts();
      expect(list.length).toBe(1);
      const created = await service.createPrompt({ prompt: 'Daily check', active: true, order: 1 });
      expect(created.prompt).toBe('What worked today?');
    });
  });
});
