import { PointsController } from './points.controller';
import { StreakController } from './streak.controller';
import { PointsService } from './points.service';
import { StreakService } from './streak.service';
import { POINTS_LEDGER_REASONS } from '@sofe/shared';

describe('Points & Streak Controllers (Task T3.3)', () => {
  let pointsController: PointsController;
  let streakController: StreakController;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockReq = {
    user: {
      _id: { toString: () => mockUserId },
      userId: mockUserId,
    },
  };

  const mockPointsService = {
    getPointsBalance: jest.fn().mockResolvedValue({ pointsBalance: 250 }),
    getPointsHistory: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    }),
    awardPoints: jest.fn().mockResolvedValue({
      balanceAfter: 275,
      alreadyProcessed: false,
    }),
  };

  const mockStreakService = {
    getStreakStatus: jest.fn().mockResolvedValue({
      current: 5,
      longest: 10,
      isActiveToday: true,
      todayDateKey: '2026-11-03',
      recentDays: [],
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pointsController = new PointsController(mockPointsService as unknown as PointsService);
    streakController = new StreakController(mockStreakService as unknown as StreakService);
  });

  describe('PointsController', () => {
    it('GET /points/balance returns balance', async () => {
      const res = await pointsController.getBalance(mockReq as never);
      expect(res).toEqual({ pointsBalance: 250 });
      expect(mockPointsService.getPointsBalance).toHaveBeenCalledWith(mockUserId);
    });

    it('GET /points/history returns history', async () => {
      const res = await pointsController.getHistory(mockReq as never, { page: 1, limit: 10 });
      expect(res.total).toBe(0);
      expect(mockPointsService.getPointsHistory).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 10,
      });
    });

    it('POST /points/award awards points', async () => {
      const res = await pointsController.awardPoints(mockReq as never, {
        amount: 25,
        reason: POINTS_LEDGER_REASONS.LESSON,
        idempotencyKey: 'key-1',
      });
      expect(res.balanceAfter).toBe(275);
      expect(mockPointsService.awardPoints).toHaveBeenCalledWith({
        userId: mockUserId,
        amount: 25,
        reason: POINTS_LEDGER_REASONS.LESSON,
        idempotencyKey: 'key-1',
      });
    });
  });

  describe('StreakController', () => {
    it('GET /streak returns streak status', async () => {
      const res = await streakController.getStreak(mockReq as never, 'Asia/Kolkata');
      expect(res.current).toBe(5);
      expect(mockStreakService.getStreakStatus).toHaveBeenCalledWith(mockUserId, 'Asia/Kolkata');
    });
  });
});
