import { ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ACHIEVEMENT_RULE_TYPES, ACHIEVEMENT_TIERS } from '@sofe/shared';
import { AchievementsService } from './achievements.service';

describe('AchievementsService (Task T3.8)', () => {
  let service: AchievementsService;

  const mockUserId = new Types.ObjectId().toString();

  let userStore: Record<string, unknown> | null;
  let achievementsStore: Array<Record<string, unknown>>;
  let userAchievementsStore: Array<Record<string, unknown>>;
  let practiceAttemptsStore: Array<Record<string, unknown>>;
  let lessonProgressStore: Array<Record<string, unknown>>;
  let enrollmentsStore: Array<Record<string, unknown>>;

  const mockAchievementModel = {
    find: jest.fn().mockImplementation((filter?: { status?: string }) => ({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockImplementation(() => {
          let list = [...achievementsStore];
          if (filter?.status) {
            list = list.filter((a) => a['status'] === filter.status);
          }
          return Promise.resolve(list);
        }),
      }),
    })),
    findOne: jest.fn().mockImplementation((filter: { key?: string }) => {
      const found = achievementsStore.find((a) => a['key'] === filter.key);
      return Promise.resolve(found || null);
    }),
    findById: jest.fn().mockImplementation((id: string) => {
      const found = achievementsStore.find((a) => a['_id']?.toString() === id);
      return Promise.resolve(found || null);
    }),
    findByIdAndUpdate: jest
      .fn()
      .mockImplementation((id: string, update: { $set?: Record<string, unknown> }) => {
        const found = achievementsStore.find((a) => a['_id']?.toString() === id);
        if (!found) return Promise.resolve(null);
        if (update.$set) {
          Object.assign(found, update.$set);
        }
        return Promise.resolve(found);
      }),
    create: jest.fn().mockImplementation((dto: Record<string, unknown>) => {
      const created = {
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      };
      achievementsStore.push(created);
      return Promise.resolve(created);
    }),
    findOneAndUpdate: jest
      .fn()
      .mockImplementation((filter: { key: string }, update: { $set: Record<string, unknown> }) => {
        let found = achievementsStore.find((a) => a['key'] === filter.key);
        if (!found) {
          found = {
            _id: new Types.ObjectId(),
            key: filter.key,
            ...update.$set,
          };
          achievementsStore.push(found);
        } else {
          Object.assign(found, update.$set);
        }
        return Promise.resolve(found);
      }),
  };

  const mockUserAchievementModel = {
    find: jest.fn().mockImplementation((filter: { userId?: Types.ObjectId }) => {
      const getList = () =>
        userAchievementsStore.filter((u) => u['userId']?.toString() === filter.userId?.toString());
      return {
        then: (resolve: (val: unknown) => void) => resolve(getList()),
        lean: jest.fn().mockImplementation(() => Promise.resolve(getList())),
      };
    }),
    create: jest.fn().mockImplementation((docs: Array<Record<string, unknown>>) => {
      const created = docs.map((d) => {
        const row = {
          _id: new Types.ObjectId(),
          unlockedAt: new Date(),
          ...d,
        };
        userAchievementsStore.push(row);
        return row;
      });
      return Promise.resolve(created);
    }),
    aggregate: jest.fn().mockImplementation(() => {
      const map = new Map<string, number>();
      for (const ua of userAchievementsStore) {
        const key = ua['achievementKey'] as string;
        map.set(key, (map.get(key) || 0) + 1);
      }
      return Promise.resolve(Array.from(map.entries()).map(([k, count]) => ({ _id: k, count })));
    }),
  };

  const mockUserModel = {
    findById: jest.fn().mockImplementation((id: Types.ObjectId | string) => {
      if (userStore && userStore['_id']?.toString() === id.toString()) {
        return Promise.resolve(userStore);
      }
      return Promise.resolve(null);
    }),
  };

  const mockPracticeAttemptModel = {
    countDocuments: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
      const count = practiceAttemptsStore.filter(
        (p) =>
          p['userId']?.toString() === filter['userId']?.toString() &&
          (!filter['status'] || p['status'] === filter['status']),
      ).length;
      return Promise.resolve(count);
    }),
  };

  const mockLessonProgressModel = {
    find: jest.fn().mockImplementation((filter: { userId?: Types.ObjectId }) => ({
      lean: jest.fn().mockImplementation(() => {
        const list = lessonProgressStore.filter(
          (lp) => lp['userId']?.toString() === filter.userId?.toString(),
        );
        return Promise.resolve(list);
      }),
    })),
    aggregate: jest.fn().mockImplementation(() => {
      // Group by userId and sum watchedSec
      const map = new Map<string, number>();
      for (const lp of lessonProgressStore) {
        const uId = (lp['userId'] as Types.ObjectId).toString();
        map.set(uId, (map.get(uId) || 0) + ((lp['watchedSec'] as number) || 0));
      }
      const sorted = Array.from(map.entries())
        .map(([uId, total]) => ({
          _id: new Types.ObjectId(uId),
          totalWatchedSec: total,
        }))
        .sort((a, b) => a.totalWatchedSec - b.totalWatchedSec);
      return Promise.resolve(sorted);
    }),
  };

  const mockEnrollmentModel = {
    countDocuments: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
      const count = enrollmentsStore.filter(
        (e) =>
          e['userId']?.toString() === filter['userId']?.toString() &&
          (!filter['status'] || e['status'] === filter['status']),
      ).length;
      return Promise.resolve(count);
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userStore = {
      _id: new Types.ObjectId(mockUserId),
      streak: { current: 0, longest: 0 },
    };

    achievementsStore = [
      {
        _id: new Types.ObjectId(),
        key: 'seven_day_streak',
        title: '7-Day Streak',
        description: 'Maintain an unbroken 7-day streak',
        iconUrl: 'https://assets.sofe.app/badges/streak-7.svg',
        tier: ACHIEVEMENT_TIERS.GOLD,
        rule: {
          type: ACHIEVEMENT_RULE_TYPES.STREAK_DAYS,
          threshold: 7,
        },
        status: 'active',
        order: 1,
      },
      {
        _id: new Types.ObjectId(),
        key: 'quiz_master',
        title: 'Quiz Master',
        description: 'Score 80%+ on 5 quizzes',
        iconUrl: 'https://assets.sofe.app/badges/quiz-master.svg',
        tier: ACHIEVEMENT_TIERS.SILVER,
        rule: {
          type: ACHIEVEMENT_RULE_TYPES.QUIZZES_COMPLETED,
          threshold: 5,
        },
        status: 'active',
        order: 2,
      },
      {
        _id: new Types.ObjectId(),
        key: 'top_10_percent_learner',
        title: 'Top 10% Founder',
        description: 'Rank among top 10% learners by video watch time',
        iconUrl: 'https://assets.sofe.app/badges/top-learner.svg',
        tier: ACHIEVEMENT_TIERS.GOLD,
        rule: {
          type: ACHIEVEMENT_RULE_TYPES.LEARNING_TIME_PERCENTILE,
          threshold: 90,
        },
        status: 'active',
        order: 3,
      },
      {
        _id: new Types.ObjectId(),
        key: 'course_finisher',
        title: 'Course Finisher',
        description: 'Complete 1 course',
        iconUrl: 'https://assets.sofe.app/badges/course-finisher.svg',
        tier: ACHIEVEMENT_TIERS.GOLD,
        rule: {
          type: ACHIEVEMENT_RULE_TYPES.COURSES_COMPLETED,
          threshold: 1,
        },
        status: 'active',
        order: 4,
      },
    ];

    userAchievementsStore = [];
    practiceAttemptsStore = [];
    lessonProgressStore = [];
    enrollmentsStore = [];

    service = new AchievementsService(
      mockAchievementModel as never,
      mockUserAchievementModel as never,
      mockUserModel as never,
      mockPracticeAttemptModel as never,
      mockLessonProgressModel as never,
      mockEnrollmentModel as never,
    );
  });

  describe('checkAndUnlock: 7-Day Streak', () => {
    it('unlocks 7-Day Streak when user streak reaches 7 days', async () => {
      if (userStore) userStore['streak'] = { current: 7 };

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.length).toBe(1);
      expect(newlyUnlocked[0].key).toBe('seven_day_streak');
      expect(userAchievementsStore.length).toBe(1);
      expect(userAchievementsStore[0]['achievementKey']).toBe('seven_day_streak');
    });

    it('does not unlock 7-Day Streak when user streak is below 7 days', async () => {
      if (userStore) userStore['streak'] = { current: 6 };

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.length).toBe(0);
      expect(userAchievementsStore.length).toBe(0);
    });

    it('is idempotent: does not duplicate unlock if already awarded', async () => {
      if (userStore) userStore['streak'] = { current: 7 };

      const firstPass = await service.checkAndUnlock(mockUserId);
      expect(firstPass.length).toBe(1);
      expect(userAchievementsStore.length).toBe(1);

      // Second check with streak still 7 or higher
      if (userStore) userStore['streak'] = { current: 8 };
      const secondPass = await service.checkAndUnlock(mockUserId);
      expect(secondPass.length).toBe(0);
      expect(userAchievementsStore.length).toBe(1);
    });
  });

  describe('checkAndUnlock: Quiz Master', () => {
    it('unlocks Quiz Master when completed quizzes reaches threshold 5', async () => {
      for (let i = 0; i < 5; i++) {
        practiceAttemptsStore.push({
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(mockUserId),
          status: 'completed',
        });
      }

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.some((a) => a.key === 'quiz_master')).toBe(true);
      expect(userAchievementsStore.some((ua) => ua['achievementKey'] === 'quiz_master')).toBe(true);
    });

    it('does not unlock Quiz Master when completed quizzes count is 4', async () => {
      for (let i = 0; i < 4; i++) {
        practiceAttemptsStore.push({
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(mockUserId),
          status: 'completed',
        });
      }

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.some((a) => a.key === 'quiz_master')).toBe(false);
    });
  });

  describe('checkAndUnlock: Top 10% Learner', () => {
    it('unlocks Top 10% Founder when user watch time ranks in 90th percentile', async () => {
      // Create 9 other users with low watch time (100 sec each)
      for (let i = 1; i <= 9; i++) {
        lessonProgressStore.push({
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(),
          watchedSec: 100,
        });
      }

      // Current user has high watch time (10,000 sec) => ranks #10 out of 10 => 100th percentile >= 90
      lessonProgressStore.push({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUserId),
        watchedSec: 10000,
      });

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.some((a) => a.key === 'top_10_percent_learner')).toBe(true);
      expect(
        userAchievementsStore.some((ua) => ua['achievementKey'] === 'top_10_percent_learner'),
      ).toBe(true);
    });

    it('does not unlock Top 10% Founder when user ranks below 90th percentile', async () => {
      // Create 9 other users with high watch time (5000 sec)
      for (let i = 1; i <= 9; i++) {
        lessonProgressStore.push({
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(),
          watchedSec: 5000,
        });
      }

      // Current user has lowest watch time (50 sec) => rank 1/10 => 10th percentile < 90
      lessonProgressStore.push({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUserId),
        watchedSec: 50,
      });

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.some((a) => a.key === 'top_10_percent_learner')).toBe(false);
    });
  });

  describe('checkAndUnlock: Course Finisher', () => {
    it('unlocks Course Finisher when user completes 1 course', async () => {
      enrollmentsStore.push({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUserId),
        status: 'completed',
      });

      const newlyUnlocked = await service.checkAndUnlock(mockUserId);
      expect(newlyUnlocked.some((a) => a.key === 'course_finisher')).toBe(true);
    });
  });

  describe('listLearnerAchievements', () => {
    it('returns all active achievements annotated with locked/unlocked state and progress metrics', async () => {
      if (userStore) userStore['streak'] = { current: 4 }; // 4 out of 7

      const res = await service.listLearnerAchievements(mockUserId);
      expect(res.totalCount).toBe(4);
      expect(res.unlockedCount).toBe(0);

      const streakItem = res.items.find((i) => i.key === 'seven_day_streak');
      expect(streakItem).toBeDefined();
      expect(streakItem?.unlocked).toBe(false);
      expect(streakItem?.progress.current).toBe(4);
      expect(streakItem?.progress.threshold).toBe(7);
      expect(streakItem?.progress.percent).toBe(57); // round(4/7*100) = 57%
    });

    it('returns unlocked: true and 100% progress for unlocked achievements', async () => {
      if (userStore) userStore['streak'] = { current: 7 };

      const res = await service.listLearnerAchievements(mockUserId);
      expect(res.unlockedCount).toBe(1);

      const streakItem = res.items.find((i) => i.key === 'seven_day_streak');
      expect(streakItem?.unlocked).toBe(true);
      expect(streakItem?.progress.percent).toBe(100);
      expect(streakItem?.unlockedAt).toBeDefined();
    });
  });

  describe('Admin CRUD & Seed', () => {
    it('creates a new achievement successfully', async () => {
      const created = await service.createAchievement({
        key: 'founder_network_builder',
        title: 'Network Builder',
        description: 'Connect with 10 fellow founders',
        iconUrl: 'https://assets.sofe.app/badges/network.svg',
        tier: ACHIEVEMENT_TIERS.BRONZE,
        rule: {
          type: ACHIEVEMENT_RULE_TYPES.MANUAL,
          threshold: 10,
        },
        status: 'active',
        order: 10,
      });

      expect(created.key).toBe('founder_network_builder');
      expect(achievementsStore.some((a) => a['key'] === 'founder_network_builder')).toBe(true);
    });

    it('rejects duplicate achievement key with ConflictException', async () => {
      await expect(
        service.createAchievement({
          key: 'seven_day_streak', // Already exists
          title: 'Duplicate',
          description: 'Duplicate',
          iconUrl: 'https://icon',
          tier: ACHIEVEMENT_TIERS.BRONZE,
          rule: { type: ACHIEVEMENT_RULE_TYPES.STREAK_DAYS, threshold: 7 },
          status: 'active',
          order: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('updates an achievement definition', async () => {
      const ach = achievementsStore[0];
      const updated = await service.updateAchievement((ach['_id'] as Types.ObjectId).toString(), {
        title: 'Updated 7-Day Streak Title',
      });

      expect(updated.title).toBe('Updated 7-Day Streak Title');
      expect(ach['title']).toBe('Updated 7-Day Streak Title');
    });

    it('deactivates an achievement on delete', async () => {
      const ach = achievementsStore[0];
      const res = await service.deleteAchievement((ach['_id'] as Types.ObjectId).toString());
      expect(res.success).toBe(true);
      expect(ach['status']).toBe('inactive');
    });

    it('seeds canonical achievements from data file', async () => {
      const res = await service.seedDefaults();
      expect(res.success).toBe(true);
      expect(res.count).toBe(6);
      expect(achievementsStore.length).toBeGreaterThanOrEqual(6);
    });
  });
});
