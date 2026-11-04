import { AdminAchievementsController } from './admin-achievements.controller';
import { AchievementsService } from '../../achievements/achievements.service';

describe('AdminAchievementsController (Task T3.8)', () => {
  let controller: AdminAchievementsController;
  let service: jest.Mocked<AchievementsService>;

  beforeEach(() => {
    const mockService = {
      listAllAdmin: jest.fn().mockResolvedValue([
        {
          id: 'ach-1',
          key: 'seven_day_streak',
          title: '7-Day Streak',
          unlockedCount: 42,
        },
      ]),
      createAchievement: jest.fn().mockResolvedValue({
        id: 'ach-2',
        key: 'new_badge',
        title: 'New Badge',
      }),
      updateAchievement: jest.fn().mockResolvedValue({
        id: 'ach-1',
        title: 'Updated Title',
      }),
      deleteAchievement: jest.fn().mockResolvedValue({ success: true }),
      seedDefaults: jest.fn().mockResolvedValue({ success: true, count: 6 }),
    };

    service = mockService as unknown as jest.Mocked<AchievementsService>;
    controller = new AdminAchievementsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listAchievements delegates to service', async () => {
    const res = await controller.listAchievements('active');
    expect(res.length).toBe(1);
    expect(service.listAllAdmin).toHaveBeenCalledWith('active');
  });

  it('createAchievement delegates to service', async () => {
    const dto = {
      key: 'new_badge',
      title: 'New Badge',
      description: 'Desc',
      iconUrl: 'https://icon',
      tier: 'bronze' as const,
      rule: { type: 'manual' as const, threshold: 1 },
      status: 'active' as const,
      order: 1,
    };
    const res = await controller.createAchievement(dto);
    expect(res.key).toBe('new_badge');
    expect(service.createAchievement).toHaveBeenCalledWith(dto);
  });

  it('updateAchievement delegates to service', async () => {
    const res = await controller.updateAchievement('ach-1', {
      title: 'Updated Title',
    });
    expect(res.title).toBe('Updated Title');
    expect(service.updateAchievement).toHaveBeenCalledWith('ach-1', {
      title: 'Updated Title',
    });
  });

  it('deleteAchievement delegates to service', async () => {
    const res = await controller.deleteAchievement('ach-1');
    expect(res.success).toBe(true);
    expect(service.deleteAchievement).toHaveBeenCalledWith('ach-1');
  });

  it('seedAchievements delegates to service', async () => {
    const res = await controller.seedAchievements();
    expect(res.success).toBe(true);
    expect(res.count).toBe(6);
    expect(service.seedDefaults).toHaveBeenCalled();
  });
});
