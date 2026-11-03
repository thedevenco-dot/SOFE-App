import { Types, Model } from 'mongoose';
import { PracticeService } from './practice.service';
import { PRACTICE_SLOT_KEYS, QUIZ_KINDS, QUIZ_STATUSES } from '@sofe/shared';
import {
  PracticeScheduleDocument,
  PracticeAttemptDocument,
  QuizDocument,
} from '../database/schemas';
import { QuizService } from './quiz.service';
import { StreakService } from '../points/streak.service';

describe('PracticeService (Task T3.4)', () => {
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
  let mockQuizService: {
    getPublicQuiz: jest.Mock;
  };
  let mockStreakService: {
    getStreakStatus: jest.Mock;
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
    };

    service = new PracticeService(
      mockPracticeScheduleModel as unknown as Model<PracticeScheduleDocument>,
      mockPracticeAttemptModel as unknown as Model<PracticeAttemptDocument>,
      mockQuizModel as unknown as Model<QuizDocument>,
      mockQuizService as unknown as QuizService,
      mockStreakService as unknown as StreakService,
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
});
