import { BadRequestException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { AdminQuizzesService } from './admin-quizzes.service';
import { QUIZ_KINDS, QUIZ_STATUSES, QUESTION_TYPES, type CsvQuizImportRow } from '@sofe/shared';
import { QuizDocument } from '../../database/schemas/quiz.schema';

describe('AdminQuizzesService (Task T3.5)', () => {
  let service: AdminQuizzesService;
  let mockQuizModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    deleteOne: jest.Mock;
  };

  const mockQuizId = new Types.ObjectId();

  const mockQuizDoc = {
    _id: mockQuizId,
    title: 'Unit Economics Mastery',
    kind: QUIZ_KINDS.QUICK_QUIZ,
    status: QUIZ_STATUSES.DRAFT,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q1',
        text: 'What is LTV/CAC benchmark?',
        type: QUESTION_TYPES.SINGLE,
        options: [
          { id: 'opt1', text: '3:1 or higher', isCorrect: true, explanation: 'Standard ratio' },
          { id: 'opt2', text: '1:1', isCorrect: false },
        ],
      },
    ],
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    mockQuizModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockQuizDoc]),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === mockQuizId.toHexString()) {
          return {
            ...mockQuizDoc,
            lean: jest.fn().mockResolvedValue(mockQuizDoc),
          };
        }
        return {
          lean: jest.fn().mockResolvedValue(null),
        };
      }),
      create: jest.fn().mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve({
          _id: mockQuizId,
          ...data,
        }),
      ),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    service = new AdminQuizzesService(mockQuizModel as unknown as Model<QuizDocument>);
  });

  describe('listQuizzes', () => {
    it('returns paginated quizzes', async () => {
      const res = await service.listQuizzes({ page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.total).toBe(1);
      expect(res.items[0].title).toBe('Unit Economics Mastery');
    });
  });

  describe('createQuiz with publish gate', () => {
    it('rejects publishing when quiz has fewer than 3 questions', async () => {
      await expect(
        service.createQuiz({
          title: 'Too Short',
          kind: QUIZ_KINDS.QUICK_QUIZ,
          status: QUIZ_STATUSES.PUBLISHED,
          passingScorePercent: 80,
          questions: [
            {
              id: 'q1',
              text: 'Prompt 1',
              type: QUESTION_TYPES.SINGLE,
              points: 10,
              options: [
                { id: '1', text: 'A', isCorrect: true },
                { id: '2', text: 'B', isCorrect: false },
              ],
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows publishing when quiz has at least 3 questions', async () => {
      const questions = [1, 2, 3].map((n) => ({
        id: `q${n}`,
        text: `Prompt ${n}`,
        type: QUESTION_TYPES.SINGLE,
        points: 10,
        options: [
          { id: '1', text: 'A', isCorrect: true },
          { id: '2', text: 'B', isCorrect: false },
        ],
      }));

      const res = await service.createQuiz({
        title: 'Complete Quiz',
        kind: QUIZ_KINDS.QUICK_QUIZ,
        status: QUIZ_STATUSES.PUBLISHED,
        passingScorePercent: 80,
        questions,
      });

      expect(res).toBeDefined();
      expect(mockQuizModel.create).toHaveBeenCalled();
    });
  });

  describe('CSV Import Preview & Dry Run', () => {
    it('validates CSV rows and detects formatting errors row by row', () => {
      const rows: CsvQuizImportRow[] = [
        {
          quiz_title: 'SaaS Metrics',
          question: 'What is churn?',
          type: 'single',
          option_a: 'Lost customers',
          option_b: 'New revenue',
          correct: 'A',
          explanation: 'Churn represents attrition.',
        },
        {
          quiz_title: '', // Missing title error
          question: 'Incomplete row',
          type: 'single',
          option_a: 'Opt A',
          option_b: 'Opt B',
          correct: 'A',
          explanation: 'Exp',
        },
      ];

      const dryRun = service.previewCsvImport(rows);
      expect(dryRun.totalRows).toBe(2);
      expect(dryRun.validRows).toBe(1);
      expect(dryRun.errorRows).toBe(1);
      expect(dryRun.errors.length).toBe(1);
      expect(dryRun.errors[0].row).toBe(2);
      expect(dryRun.errors[0].field).toBe('quiz_title');
    });

    it('executes valid CSV import and groups questions under quiz titles', async () => {
      const rows: CsvQuizImportRow[] = [
        {
          quiz_title: 'Go-to-Market Calibration',
          question: 'Q1',
          type: 'single',
          option_a: 'Opt 1',
          option_b: 'Opt 2',
          correct: 'A',
          explanation: 'Explanation 1',
        },
        {
          quiz_title: 'Go-to-Market Calibration',
          question: 'Q2',
          type: 'single',
          option_a: 'Opt 1',
          option_b: 'Opt 2',
          correct: 'B',
          explanation: 'Explanation 2',
        },
        {
          quiz_title: 'Go-to-Market Calibration',
          question: 'Q3',
          type: 'single',
          option_a: 'Opt 1',
          option_b: 'Opt 2',
          correct: 'A',
          explanation: 'Explanation 3',
        },
      ];

      const res = await service.executeCsvImport(rows);
      expect(res.success).toBe(true);
      expect(res.quizzesCreated).toBe(1);
      expect(res.totalQuestions).toBe(3);
      expect(mockQuizModel.create).toHaveBeenCalled();
    });
  });
});
