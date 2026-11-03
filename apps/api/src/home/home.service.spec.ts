import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HomeService, getDateKeyInTimezone, getGreetingForHour } from './home.service';

describe('HomeService (Task T3.1)', () => {
  let service: HomeService;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockDateKey = '2026-11-03';

  // In-memory collections
  let visionBoardStore: Array<Record<string, unknown>> = [];
  let dailyPlanStore: Array<Record<string, unknown>> = [];
  let quoteStore: Array<Record<string, unknown>> = [];
  let wordStore: Array<Record<string, unknown>> = [];
  let articleStore: Array<Record<string, unknown>> = [];

  const mockLearningService = {
    getContinueLesson: jest.fn(),
  };

  function createMockQuery<T>(data: T) {
    const query: Record<string, unknown> = {
      populate: jest.fn().mockImplementation(() => query),
      sort: jest.fn().mockImplementation(() => query),
      limit: jest.fn().mockImplementation(() => query),
      lean: jest.fn().mockImplementation(() => Promise.resolve(data)),
      exec: jest.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: (val: T) => void, reject?: (err: unknown) => void) =>
        Promise.resolve(data).then(resolve, reject),
      catch: (reject?: (err: unknown) => void) => Promise.resolve(data).catch(reject),
    };
    return query;
  }

  beforeEach(() => {
    visionBoardStore = [];
    dailyPlanStore = [];
    quoteStore = [
      {
        _id: new Types.ObjectId(),
        text: 'Stay hungry, stay foolish.',
        author: 'Steve Jobs',
        status: 'published',
        tags: ['inspiration'],
      },
      {
        _id: new Types.ObjectId(),
        text: 'The best way to predict the future is to invent it.',
        author: 'Alan Kay',
        status: 'published',
        tags: ['technology'],
      },
    ];
    wordStore = [
      {
        _id: new Types.ObjectId(),
        word: 'MOMENTUM',
        meaning: 'Continuous forward velocity in execution.',
        status: 'published',
      },
      {
        _id: new Types.ObjectId(),
        word: 'ASYMMETRY',
        meaning: 'Non-linear leverage on strategic bets.',
        status: 'published',
      },
    ];
    articleStore = [
      {
        _id: new Types.ObjectId(),
        slug: 'scaling-from-zero',
        title: 'Scaling from Zero: The Operator Blueprint',
        excerpt: 'How to build early operational discipline.',
        coverUrl: 'https://example.com/cover.jpg',
        readTimeMin: 6,
        status: 'published',
        featured: true,
        primaryTopicId: { name: 'Venture Strategy' },
      },
    ];

    const mockVisionBoardItemModel = {
      find: jest.fn().mockImplementation((query: Record<string, unknown>) => {
        const uIdStr = query['userId']?.toString();
        const items = visionBoardStore
          .filter((v) => v['userId']?.toString() === uIdStr)
          .sort((a, b) => (Number(a['order']) || 0) - (Number(b['order']) || 0));
        return createMockQuery(items);
      }),
      countDocuments: jest.fn().mockImplementation((query: Record<string, unknown>) => {
        const uIdStr = query['userId']?.toString();
        const items = visionBoardStore.filter((v) => v['userId']?.toString() === uIdStr);
        return Promise.resolve(items.length);
      }),
      findOne: jest.fn().mockImplementation((query: Record<string, unknown>) => {
        const item = visionBoardStore.find(
          (v) =>
            v['_id']?.toString() === query['_id']?.toString() &&
            v['userId']?.toString() === query['userId']?.toString(),
        );
        if (!item) return Promise.resolve(null);
        return Promise.resolve({
          ...item,
          save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
            Object.assign(item, this);
            return Promise.resolve(this);
          }),
        });
      }),
      updateOne: jest.fn().mockImplementation((filter, update) => {
        const item = visionBoardStore.find(
          (v) =>
            v['_id']?.toString() === filter['_id']?.toString() &&
            v['userId']?.toString() === filter['userId']?.toString(),
        );
        if (item && update['$set']) {
          Object.assign(item, update['$set']);
        }
        return Promise.resolve({ matchedCount: item ? 1 : 0 });
      }),
      deleteOne: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const initialLength = visionBoardStore.length;
        visionBoardStore = visionBoardStore.filter(
          (v) =>
            v['_id']?.toString() !== filter['_id']?.toString() ||
            v['userId']?.toString() !== filter['userId']?.toString(),
        );
        const deletedCount = initialLength - visionBoardStore.length;
        return Promise.resolve({ deletedCount });
      }),
    } as unknown as Record<string, unknown>;

    // Model constructor simulation for createVisionBoardItem
    const mockVisionBoardModelConstructor = jest.fn().mockImplementation((dto) => {
      const doc = {
        _id: new Types.ObjectId(),
        ...dto,
        save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
          visionBoardStore.push(this);
          return Promise.resolve(this);
        }),
      };
      return doc;
    });
    Object.assign(mockVisionBoardModelConstructor, mockVisionBoardItemModel);

    const mockDailyPlanModel = {
      findOne: jest.fn().mockImplementation((query: Record<string, unknown>) => {
        const uIdStr = query['userId']?.toString();
        const plan = dailyPlanStore.find((p) => {
          if (p['userId']?.toString() !== uIdStr) return false;
          if (query['dateKey'] && p['dateKey'] !== query['dateKey']) return false;
          if (query['items.id']) {
            const hasTask = (p['items'] as Array<{ id: string }>).some(
              (i) => i.id === query['items.id'],
            );
            if (!hasTask) return false;
          }
          return true;
        });
        if (!plan) return Promise.resolve(null);
        return Promise.resolve({
          ...plan,
          save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
            Object.assign(plan, this);
            return Promise.resolve(this);
          }),
        });
      }),
      findOneAndUpdate: jest.fn().mockImplementation((filter, update, _opts) => {
        const uIdStr = filter['userId']?.toString();
        let plan = dailyPlanStore.find(
          (p) => p['userId']?.toString() === uIdStr && p['dateKey'] === filter['dateKey'],
        );
        if (!plan && update['$setOnInsert']) {
          const insertData = update['$setOnInsert'] as Record<string, unknown>;
          plan = {
            _id: new Types.ObjectId(),
            ...insertData,
          };
          dailyPlanStore.push(plan);
        }
        return Promise.resolve(plan);
      }),
    };

    const mockQuoteModel = {
      find: jest.fn().mockImplementation(() => createMockQuery(quoteStore)),
    };

    const mockWordModel = {
      find: jest.fn().mockImplementation(() => createMockQuery(wordStore)),
    };

    const mockArticleModel = {
      findOne: jest.fn().mockImplementation(() => createMockQuery(articleStore[0])),
    };

    const mockUserModel = {
      findById: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(mockUserId),
        name: 'Aravind Sridhar',
        fullName: 'Aravind Sridhar',
        avatarUrl: 'https://example.com/avatar.jpg',
      }),
    };

    service = new HomeService(
      mockVisionBoardModelConstructor as never,
      mockDailyPlanModel as never,
      mockQuoteModel as never,
      mockWordModel as never,
      mockArticleModel as never,
      mockUserModel as never,
      mockLearningService as never,
    );
  });

  describe('Daily Quote and Word Rotation', () => {
    it('returns deterministic quote and word for a given dateKey', async () => {
      const q1 = await service.getDailyQuote('2026-11-03');
      const q2 = await service.getDailyQuote('2026-11-03');
      expect(q1.id).toBe(q2.id);
      expect(q1.text).toBe(q2.text);

      const w1 = await service.getDailyWord('2026-11-03');
      const w2 = await service.getDailyWord('2026-11-03');
      expect(w1.id).toBe(w2.id);
      expect(w1.word).toBe(w2.word);
    });

    it('lists available quotes and words for selection sheets', async () => {
      const quotes = await service.listQuotes();
      expect(quotes.length).toBe(2);

      const words = await service.listWords();
      expect(words.length).toBe(2);
    });
  });

  describe('Daily Plan Management (Lazy Builder)', () => {
    it('generates a personalized default daily plan if one does not exist for the dateKey', async () => {
      mockLearningService.getContinueLesson.mockResolvedValueOnce({
        lesson: {
          id: 'l-101',
          title: 'Problem-Solution Fit Matrix',
        },
      });

      const plan = await service.getOrCreateDailyPlan(mockUserId, mockDateKey);

      expect(plan).toBeDefined();
      expect(plan.dateKey).toBe(mockDateKey);
      expect(plan.items.length).toBe(4);
      expect(plan.items[0].key).toBe('watch_lesson');
      expect(plan.items[0].label).toContain('Problem-Solution Fit Matrix');
      expect(plan.completedCount).toBe(0);

      // Verify second retrieval returns the existing plan without recreating
      const existing = await service.getOrCreateDailyPlan(mockUserId, mockDateKey);
      expect(existing.id).toBe(plan.id);
    });

    it('toggles task completion and updates completedCount', async () => {
      const plan = await service.getOrCreateDailyPlan(mockUserId, mockDateKey);
      const taskId = plan.items[0].id;

      // Mark done = true
      const updated = await service.toggleTaskCompletion(mockUserId, taskId, true, mockDateKey);
      expect(updated.completedCount).toBe(1);
      const task = updated.items.find((i) => i.id === taskId);
      expect(task?.done).toBe(true);
      expect(task?.doneAt).toBeDefined();

      // Mark done = false
      const reverted = await service.toggleTaskCompletion(mockUserId, taskId, false, mockDateKey);
      expect(reverted.completedCount).toBe(0);
      const revertedTask = reverted.items.find((i) => i.id === taskId);
      expect(revertedTask?.done).toBe(false);
      expect(revertedTask?.doneAt).toBeUndefined();
    });

    it('throws NotFoundException when toggling task on unknown plan or task', async () => {
      await expect(
        service.toggleTaskCompletion(mockUserId, 'non-existent-task-id', true, mockDateKey),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Vision Board Management', () => {
    it('creates vision board items and returns them in ascending order', async () => {
      const item1 = await service.createVisionBoardItem(mockUserId, {
        imageUrl: 'https://example.com/img1.jpg',
        caption: 'Series A Milestone',
      });
      const item2 = await service.createVisionBoardItem(mockUserId, {
        imageUrl: 'https://example.com/img2.jpg',
        caption: 'First 1,000 Customers',
      });

      expect(item1.caption).toBe('Series A Milestone');
      expect(item2.caption).toBe('First 1,000 Customers');

      const items = await service.getVisionBoardItems(mockUserId);
      expect(items.length).toBe(2);
      expect(items[0].caption).toBe('Series A Milestone');
      expect(items[1].caption).toBe('First 1,000 Customers');
    });

    it('enforces a maximum of 12 items on the vision board', async () => {
      for (let i = 0; i < 12; i++) {
        await service.createVisionBoardItem(mockUserId, {
          imageUrl: `https://example.com/img-${i}.jpg`,
          caption: `Goal ${i}`,
        });
      }

      await expect(
        service.createVisionBoardItem(mockUserId, {
          imageUrl: 'https://example.com/img-13.jpg',
          caption: 'Limit reached goal',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates, reorders, and deletes vision board items', async () => {
      const item = await service.createVisionBoardItem(mockUserId, {
        imageUrl: 'https://example.com/img.jpg',
        caption: 'Original Caption',
      });

      // Update
      const updated = await service.updateVisionBoardItem(mockUserId, item.id, {
        caption: 'Updated Caption',
      });
      expect(updated.caption).toBe('Updated Caption');

      // Reorder
      const reordered = await service.reorderVisionBoardItems(mockUserId, [item.id]);
      expect(reordered[0].order).toBe(0);

      // Delete
      const del = await service.deleteVisionBoardItem(mockUserId, item.id);
      expect(del.success).toBe(true);

      const itemsAfter = await service.getVisionBoardItems(mockUserId);
      expect(itemsAfter.length).toBe(0);
    });
  });

  describe('Timezone & Greeting Utilities', () => {
    it('computes greeting based on time of day', () => {
      expect(getGreetingForHour(8, 'Aravind')).toBe('Good morning, Aravind.');
      expect(getGreetingForHour(14, 'Aravind')).toBe('Good afternoon, Aravind.');
      expect(getGreetingForHour(20, 'Aravind')).toBe('Good evening, Aravind.');
    });

    it('computes dateKey in provided IANA timezone', () => {
      const resKolkata = getDateKeyInTimezone('Asia/Kolkata');
      expect(resKolkata.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof resKolkata.hour).toBe('number');

      const resNY = getDateKeyInTimezone('America/New_York');
      expect(resNY.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Fallback on invalid timezone
      const fallback = getDateKeyInTimezone('Invalid/Timezone');
      expect(fallback.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Home Dashboard Aggregator (HM1)', () => {
    it('returns the complete Home Dashboard payload with greeting, quote, word, vision board, plan, and continue learning', async () => {
      mockLearningService.getContinueLesson.mockResolvedValueOnce({
        courseId: 'c-101',
        lesson: {
          id: 'l-101',
          title: 'Problem-Solution Fit Matrix',
          durationSec: 1080,
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
        progress: {
          percent: 45,
        },
      });

      const dashboard = await service.getHomeDashboard(mockUserId, 'Asia/Kolkata');

      expect(dashboard).toBeDefined();
      expect(dashboard.greeting).toContain('Aravind');
      expect(dashboard.quote.text).toBeDefined();
      expect(dashboard.word.word).toBeDefined();
      expect(dashboard.todayPlan.items.length).toBeGreaterThanOrEqual(1);
      expect(dashboard.continueLearning?.lessonTitle).toBe('Problem-Solution Fit Matrix');
      expect(dashboard.continueLearning?.percent).toBe(45);
      expect(dashboard.spotlightArticle?.title).toBe('Scaling from Zero: The Operator Blueprint');
      expect(dashboard.streak.currentStreakDays).toBe(26);
    });
  });
});
