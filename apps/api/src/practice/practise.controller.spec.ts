import { QuizzesController } from './quizzes.controller';
import { PractiseController } from './practise.controller';
import { BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { PracticeService } from './practice.service';
import type { SubmitQuizAttemptDto } from '@sofe/shared';

describe('Quizzes & Practise Controllers (Task T3.4)', () => {
  let quizzesController: QuizzesController;
  let practiseController: PractiseController;
  let mockQuizService: {
    getPublicQuiz: jest.Mock;
    submitQuiz: jest.Mock;
  };
  let mockPracticeService: {
    getTodayPractice: jest.Mock;
    getPracticeHistory: jest.Mock;
    getTodayReflection: jest.Mock;
    submitReflection: jest.Mock;
    getLearnerRewards: jest.Mock;
    redeemReward: jest.Mock;
  };

  const mockUserReq = {
    user: {
      userId: 'user_123',
    },
  };

  beforeEach(() => {
    mockQuizService = {
      getPublicQuiz: jest.fn().mockResolvedValue({ id: 'quiz_1' }),
      submitQuiz: jest.fn().mockResolvedValue({ attemptId: 'att_1', score: 100 }),
    };
    mockPracticeService = {
      getTodayPractice: jest.fn().mockResolvedValue({ dateKey: '2026-11-03' }),
      getPracticeHistory: jest.fn().mockResolvedValue([]),
      getTodayReflection: jest.fn().mockResolvedValue({ id: 'r1', prompt: 'Think big' }),
      submitReflection: jest.fn().mockResolvedValue({ success: true, pointsAwarded: 20 }),
      getLearnerRewards: jest.fn().mockResolvedValue([{ id: 'rew1', title: 'Course' }]),
      redeemReward: jest.fn().mockResolvedValue({ success: true, remainingBalance: 400 }),
    };

    quizzesController = new QuizzesController(mockQuizService as unknown as QuizService);
    practiseController = new PractiseController(mockPracticeService as unknown as PracticeService);
  });

  describe('QuizzesController', () => {
    it('getPublicQuiz delegates to QuizService', async () => {
      const res = await quizzesController.getPublicQuiz('quiz_1');
      expect(res).toEqual({ id: 'quiz_1' });
      expect(mockQuizService.getPublicQuiz).toHaveBeenCalledWith('quiz_1');
    });

    it('submitQuiz validates input and delegates to QuizService', async () => {
      const validBody = {
        answers: [{ questionId: 'q1', selectedOptionIds: ['opt1'] }],
      };
      const res = await quizzesController.submitQuiz(mockUserReq, 'quiz_1', validBody, 'UTC');
      expect(res).toEqual({ attemptId: 'att_1', score: 100 });
      expect(mockQuizService.submitQuiz).toHaveBeenCalledWith(
        'user_123',
        'quiz_1',
        validBody,
        'UTC',
      );
    });

    it('submitQuiz throws BadRequestException on invalid body', async () => {
      const invalidBody = { answers: 'not-an-array' } as unknown as SubmitQuizAttemptDto;
      await expect(
        quizzesController.submitQuiz(mockUserReq, 'quiz_1', invalidBody),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PractiseController', () => {
    it('getToday delegates to PracticeService', async () => {
      const res = await practiseController.getToday(mockUserReq, 'Asia/Kolkata');
      expect(res).toEqual({ dateKey: '2026-11-03' });
      expect(mockPracticeService.getTodayPractice).toHaveBeenCalledWith('user_123', 'Asia/Kolkata');
    });

    it('getHistory delegates to PracticeService with parsed limit', async () => {
      await practiseController.getHistory(mockUserReq, '15');
      expect(mockPracticeService.getPracticeHistory).toHaveBeenCalledWith('user_123', 15);
    });

    it('getTodayReflection delegates to PracticeService', async () => {
      const res = await practiseController.getTodayReflection('Asia/Kolkata');
      expect(res).toEqual({ id: 'r1', prompt: 'Think big' });
      expect(mockPracticeService.getTodayReflection).toHaveBeenCalledWith('Asia/Kolkata');
    });

    it('submitReflection delegates to PracticeService', async () => {
      const res = await practiseController.submitReflection(
        mockUserReq,
        { responseText: 'Insight on unit economics' },
        'UTC',
      );
      expect(res).toEqual({ success: true, pointsAwarded: 20 });
      expect(mockPracticeService.submitReflection).toHaveBeenCalledWith(
        'user_123',
        { responseText: 'Insight on unit economics' },
        'UTC',
      );
    });

    it('getRewards delegates to PracticeService', async () => {
      const res = await practiseController.getRewards();
      expect(res).toHaveLength(1);
      expect(mockPracticeService.getLearnerRewards).toHaveBeenCalled();
    });

    it('redeemReward delegates to PracticeService', async () => {
      const res = await practiseController.redeemReward(mockUserReq, 'rew1');
      expect(res).toEqual({ success: true, remainingBalance: 400 });
      expect(mockPracticeService.redeemReward).toHaveBeenCalledWith('user_123', 'rew1');
    });
  });
});
