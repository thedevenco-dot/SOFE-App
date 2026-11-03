import { Types } from 'mongoose';
import { StreakService, getDateKeyInTimezone, getYesterdayDateKey } from './streak.service';

describe('StreakService (Task T3.3)', () => {
  let service: StreakService;

  const mockUserId = new Types.ObjectId().toHexString();
  let userStore: Record<string, unknown> | null = null;
  let streakDayStore: Array<Record<string, unknown>> = [];

  const mockStreakDayModel = {
    findOneAndUpdate: jest
      .fn()
      .mockImplementation((filter: Record<string, unknown>, update: Record<string, unknown>) => {
        let entry = streakDayStore.find(
          (s) =>
            s['userId']?.toString() === filter['userId']?.toString() &&
            s['dateKey'] === filter['dateKey'],
        );
        if (!entry) {
          entry = {
            _id: new Types.ObjectId(),
            userId: filter['userId'],
            dateKey: filter['dateKey'],
            activityCount: 0,
            completedTasksCount: 0,
            pointsEarned: 0,
            createdAt: new Date(),
          };
          streakDayStore.push(entry);
        }

        if (update['$inc']) {
          const inc = update['$inc'] as Record<string, number>;
          if (inc['activityCount'])
            entry['activityCount'] = (entry['activityCount'] as number) + inc['activityCount'];
          if (inc['completedTasksCount'])
            entry['completedTasksCount'] =
              (entry['completedTasksCount'] as number) + inc['completedTasksCount'];
          if (inc['pointsEarned'])
            entry['pointsEarned'] = (entry['pointsEarned'] as number) + inc['pointsEarned'];
        }
        return Promise.resolve(entry);
      }),
    find: jest.fn().mockImplementation((query: Record<string, unknown>) => {
      const items = streakDayStore
        .filter((s) => s['userId']?.toString() === query['userId']?.toString())
        .sort((a, b) => ((b['dateKey'] as string) > (a['dateKey'] as string) ? 1 : -1));
      return {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation((lim: number) => ({
          lean: () => Promise.resolve(items.slice(0, lim)),
        })),
      };
    }),
  };

  const mockUserModel = {
    findById: jest.fn().mockImplementation((id: Types.ObjectId | string) => {
      if (userStore && userStore['_id']?.toString() === id.toString()) {
        return Promise.resolve(userStore);
      }
      return Promise.resolve(null);
    }),
    findByIdAndUpdate: jest
      .fn()
      .mockImplementation((id: Types.ObjectId | string, update: Record<string, unknown>) => {
        if (userStore && userStore['_id']?.toString() === id.toString()) {
          if (update['$set']) {
            const s = update['$set'] as Record<string, unknown>;
            if (s['streak.current'] !== undefined) {
              userStore['streak'] = {
                ...(userStore['streak'] as Record<string, unknown>),
                current: s['streak.current'],
                longest: s['streak.longest'],
                lastActiveDateKey: s['streak.lastActiveDateKey'],
              };
            }
          }
          return Promise.resolve(userStore);
        }
        return Promise.resolve(null);
      }),
  };

  beforeEach(() => {
    streakDayStore = [];
    userStore = {
      _id: new Types.ObjectId(mockUserId),
      streak: {
        current: 0,
        longest: 0,
        lastActiveDateKey: undefined,
      },
    };
    jest.clearAllMocks();

    service = new StreakService(mockStreakDayModel as never, mockUserModel as never);
  });

  describe('getYesterdayDateKey', () => {
    it('computes yesterday dateKey correctly across month and year boundaries', () => {
      expect(getYesterdayDateKey('2026-11-03')).toBe('2026-11-02');
      expect(getYesterdayDateKey('2026-11-01')).toBe('2026-10-31');
      expect(getYesterdayDateKey('2026-03-01')).toBe('2026-02-28'); // Non-leap year 2026
      expect(getYesterdayDateKey('2026-01-01')).toBe('2025-12-31'); // Year rollover
    });
  });

  describe('getDateKeyInTimezone', () => {
    it('returns valid YYYY-MM-DD format in specified timezone', () => {
      const kolkata = getDateKeyInTimezone('Asia/Kolkata');
      expect(kolkata).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const ny = getDateKeyInTimezone('America/New_York');
      expect(ny).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const fallback = getDateKeyInTimezone('Invalid/Zone');
      expect(fallback).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('recordActivity & Streak Rollover', () => {
    it('starts streak at current: 1 and longest: 1 on first ever activity', async () => {
      const res = await service.recordActivity(mockUserId, '2026-11-01');
      expect(res.current).toBe(1);
      expect(res.longest).toBe(1);
      expect(res.isNewDay).toBe(true);
      expect(res.dateKey).toBe('2026-11-01');

      const userStreak = userStore?.['streak'] as Record<string, unknown>;
      expect(userStreak['current']).toBe(1);
      expect(userStreak['longest']).toBe(1);
      expect(userStreak['lastActiveDateKey']).toBe('2026-11-01');
    });

    it('is idempotent on the same day: multiple activities keep current streak unchanged', async () => {
      // First activity on 2026-11-01
      await service.recordActivity(mockUserId, '2026-11-01', undefined, 1, 25);

      // Second activity on same day
      const res2 = await service.recordActivity(mockUserId, '2026-11-01', undefined, 2, 50);

      expect(res2.isNewDay).toBe(false);
      expect(res2.current).toBe(1);
      expect(res2.longest).toBe(1);

      // streakDay entry accumulated activity count
      expect(streakDayStore.length).toBe(1);
      expect(streakDayStore[0]['activityCount']).toBe(2);
      expect(streakDayStore[0]['completedTasksCount']).toBe(3);
      expect(streakDayStore[0]['pointsEarned']).toBe(75);
    });

    it('extends streak consecutively: active yesterday increments streak and updates longest', async () => {
      // Day 1
      await service.recordActivity(mockUserId, '2026-11-01');

      // Day 2 (consecutive)
      const resDay2 = await service.recordActivity(mockUserId, '2026-11-02');
      expect(resDay2.isNewDay).toBe(true);
      expect(resDay2.current).toBe(2);
      expect(resDay2.longest).toBe(2);

      // Day 3 (consecutive)
      const resDay3 = await service.recordActivity(mockUserId, '2026-11-03');
      expect(resDay3.isNewDay).toBe(true);
      expect(resDay3.current).toBe(3);
      expect(resDay3.longest).toBe(3);
    });

    it('resets streak to 1 when gap > 1 day, while preserving longest streak', async () => {
      // Build a 5-day streak
      userStore = {
        _id: new Types.ObjectId(mockUserId),
        streak: {
          current: 5,
          longest: 12,
          lastActiveDateKey: '2026-10-30',
        },
      };

      // Gap of 2 days: next active on 2026-11-02
      const res = await service.recordActivity(mockUserId, '2026-11-02');

      expect(res.isNewDay).toBe(true);
      expect(res.current).toBe(1); // Reset
      expect(res.longest).toBe(12); // Preserved

      const userStreak = userStore?.['streak'] as Record<string, unknown>;
      expect(userStreak['current']).toBe(1);
      expect(userStreak['longest']).toBe(12);
      expect(userStreak['lastActiveDateKey']).toBe('2026-11-02');
    });
  });

  describe('getStreakStatus', () => {
    it('returns streak status, isActiveToday, and recent days list', async () => {
      userStore = {
        _id: new Types.ObjectId(mockUserId),
        streak: {
          current: 4,
          longest: 7,
          lastActiveDateKey: '2026-11-03',
        },
      };

      streakDayStore.push({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUserId),
        dateKey: '2026-11-03',
        activityCount: 3,
        completedTasksCount: 2,
        pointsEarned: 50,
      });

      const status = await service.getStreakStatus(mockUserId);
      expect(status.current).toBe(4);
      expect(status.longest).toBe(7);
      expect(status.recentDays.length).toBe(1);
      expect(status.recentDays[0].activityCount).toBe(3);
    });
  });
});
