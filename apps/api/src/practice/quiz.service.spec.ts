import { NotFoundException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { QuizService } from './quiz.service';
import { QUIZ_KINDS, QUESTION_TYPES, QUIZ_STATUSES, POINTS_LEDGER_REASONS } from '@sofe/shared';
import {
  QuizDocument,
  PracticeAttemptDocument,
  PracticeScheduleDocument,
  DailyPlanDocument,
} from '../database/schemas';
import { PointsService } from '../points/points.service';
import { StreakService } from '../points/streak.service';

describe('QuizService (Task T3.4)', () => {
  let service: QuizService;
  let mockQuizModel: {
    findOne: jest.Mock;
    findById: jest.Mock;
  };
  let mockPracticeAttemptModel: {
    create: jest.Mock;
  };
  let mockPracticeScheduleModel: {
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
  };
  let mockDailyPlanModel: {
    findOne: jest.Mock;
  };
  let mockPointsService: {
    awardPoints: jest.Mock;
  };
  let mockStreakService: {
    recordActivity: jest.Mock;
  };

  const mockQuizId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId().toHexString();

  const sampleQuiz = {
    _id: mockQuizId,
    title: 'Rapid Scaling Decision Quiz',
    kind: QUIZ_KINDS.QUICK_QUIZ,
    status: QUIZ_STATUSES.PUBLISHED,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q1',
        text: 'What is the primary lever for CAC reduction?',
        type: QUESTION_TYPES.SINGLE,
        points: 10,
        options: [
          {
            id: 'opt_1a',
            text: 'Organic referral loops',
            isCorrect: true,
            explanation: 'Referrals reduce blended CAC.',
          },
          {
            id: 'opt_1b',
            text: 'Paid Google Ads bidding higher',
            isCorrect: false,
            explanation: 'Increases CAC.',
          },
        ],
      },
      {
        id: 'q2',
        text: 'Which metrics reflect retained cohorts? (Select all)',
        type: QUESTION_TYPES.MULTI,
        points: 10,
        options: [
          {
            id: 'opt_2a',
            text: 'Net Revenue Retention',
            isCorrect: true,
            explanation: 'Measures expansion and retention.',
          },
          {
            id: 'opt_2b',
            text: 'Logo Retention',
            isCorrect: true,
            explanation: 'Measures account retention.',
          },
          {
            id: 'opt_2c',
            text: 'Gross Page Views',
            isCorrect: false,
            explanation: 'Vanity metric.',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    mockQuizModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };
    mockPracticeAttemptModel = {
      create: jest.fn(),
    };
    mockPracticeScheduleModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue({
        slots: [{ slotKey: 'quick_quiz', done: true }],
        completedCount: 1,
        save: jest.fn().mockResolvedValue({}),
      }),
    };
    mockDailyPlanModel = {
      findOne: jest.fn().mockResolvedValue({
        items: [{ key: 'complete_quiz', done: false, doneAt: undefined }],
        completedCount: 0,
        save: jest.fn().mockResolvedValue({}),
      }),
    };
    mockPointsService = {
      awardPoints: jest.fn().mockResolvedValue({ balance: 50 }),
    };
    mockStreakService = {
      recordActivity: jest.fn().mockResolvedValue({ current: 2 }),
    };

    service = new QuizService(
      mockQuizModel as unknown as Model<QuizDocument>,
      mockPracticeAttemptModel as unknown as Model<PracticeAttemptDocument>,
      mockPracticeScheduleModel as unknown as Model<PracticeScheduleDocument>,
      mockDailyPlanModel as unknown as Model<DailyPlanDocument>,
      mockPointsService as unknown as PointsService,
      mockStreakService as unknown as StreakService,
    );
  });

  describe('getPublicQuiz', () => {
    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(service.getPublicQuiz('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if quiz is not found or not published', async () => {
      mockQuizModel.findOne.mockResolvedValue(null);
      await expect(service.getPublicQuiz(mockQuizId.toHexString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns sanitized quiz without isCorrect and without explanation', async () => {
      mockQuizModel.findOne.mockResolvedValue(sampleQuiz);
      const res = await service.getPublicQuiz(mockQuizId.toHexString());

      expect(res.id).toBe(mockQuizId.toHexString());
      expect(res.title).toBe(sampleQuiz.title);
      expect(res.questions.length).toBe(2);

      // Verify no answers leaked
      for (const q of res.questions) {
        for (const opt of q.options) {
          expect((opt as Record<string, unknown>).isCorrect).toBeUndefined();
          expect((opt as Record<string, unknown>).explanation).toBeUndefined();
        }
      }
    });
  });

  describe('submitQuiz', () => {
    it('throws NotFoundException if quiz does not exist', async () => {
      mockQuizModel.findById.mockResolvedValue(null);
      await expect(
        service.submitQuiz(mockUserId, mockQuizId.toHexString(), { answers: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('scores 100% when all single and multi answers are correct', async () => {
      mockQuizModel.findById.mockResolvedValue(sampleQuiz);
      const attemptId = new Types.ObjectId();
      mockPracticeAttemptModel.create.mockResolvedValue({
        _id: attemptId,
        score: 100,
        passed: true,
        pointsAwarded: 50,
        completedAt: new Date(),
      });

      const res = await service.submitQuiz(mockUserId, mockQuizId.toHexString(), {
        answers: [
          { questionId: 'q1', selectedOptionIds: ['opt_1a'] },
          { questionId: 'q2', selectedOptionIds: ['opt_2a', 'opt_2b'] },
        ],
      });

      expect(res.score).toBe(100);
      expect(res.passed).toBe(true);
      expect(res.totalQuestions).toBe(2);
      expect(res.correctQuestions).toBe(2);
      expect(res.pointsAwarded).toBe(50);

      // Explanations provided in result
      expect(res.questionsResult[0].isCorrect).toBe(true);
      expect(res.questionsResult[0].explanation).toBe('Referrals reduce blended CAC.');
      expect(res.questionsResult[1].isCorrect).toBe(true);

      // Points and streak activity awarded
      expect(mockPointsService.awardPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          amount: 50,
          reason: POINTS_LEDGER_REASONS.QUIZ,
          idempotencyKey: `quiz_attempt:${attemptId.toString()}`,
        }),
      );
      expect(mockStreakService.recordActivity).toHaveBeenCalled();
    });

    it('fails passing check when score is below passingScorePercent', async () => {
      mockQuizModel.findById.mockResolvedValue(sampleQuiz);
      const attemptId = new Types.ObjectId();
      mockPracticeAttemptModel.create.mockResolvedValue({
        _id: attemptId,
        score: 50,
        passed: false,
        pointsAwarded: 0,
        completedAt: new Date(),
      });

      const res = await service.submitQuiz(mockUserId, mockQuizId.toHexString(), {
        answers: [
          { questionId: 'q1', selectedOptionIds: ['opt_1a'] }, // correct
          { questionId: 'q2', selectedOptionIds: ['opt_2a', 'opt_2c'] }, // incorrect (has 2c)
        ],
      });

      expect(res.score).toBe(50);
      expect(res.passed).toBe(false);
      expect(res.correctQuestions).toBe(1);
      expect(res.pointsAwarded).toBe(0);

      // Points should not be awarded for failed attempt
      expect(mockPointsService.awardPoints).not.toHaveBeenCalled();
    });
  });
});
