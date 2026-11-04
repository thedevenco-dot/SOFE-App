import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

describe('AchievementsController (Task T3.8)', () => {
  let controller: AchievementsController;
  let service: jest.Mocked<AchievementsService>;

  beforeEach(() => {
    const mockService = {
      listLearnerAchievements: jest.fn().mockResolvedValue({
        totalCount: 1,
        unlockedCount: 0,
        items: [
          {
            id: 'ach-1',
            key: 'seven_day_streak',
            title: '7-Day Streak',
            unlocked: false,
            progress: { current: 3, threshold: 7, percent: 43 },
          },
        ],
      }),
      checkAndUnlock: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'ach-1' },
          key: 'seven_day_streak',
          title: '7-Day Streak',
          tier: 'gold',
          iconUrl: 'https://icon',
        },
      ]),
    };

    service = mockService as unknown as jest.Mocked<AchievementsService>;
    controller = new AchievementsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAchievements', () => {
    it('returns learner achievements catalogue with progress', async () => {
      const req = { user: { userId: 'user-1' } };
      const res = await controller.getAchievements(req as never);
      expect(res.totalCount).toBe(1);
      expect(service.listLearnerAchievements).toHaveBeenCalledWith('user-1');
    });
  });

  describe('checkAchievements', () => {
    it('triggers manual check and returns newly unlocked', async () => {
      const req = { user: { userId: 'user-1' } };
      const res = await controller.checkAchievements(req as never);
      expect(res.success).toBe(true);
      expect(res.newlyUnlockedCount).toBe(1);
      expect(service.checkAndUnlock).toHaveBeenCalledWith('user-1');
    });
  });
});
