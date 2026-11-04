import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

describe('RewardsController', () => {
  let controller: RewardsController;
  let service: jest.Mocked<RewardsService>;

  beforeEach(() => {
    const mockRewardsService = {
      listActiveRewards: jest.fn().mockResolvedValue([
        {
          id: 'reward-1',
          title: 'Founder Badge',
          type: 'badge',
          costPoints: 100,
        },
      ]),
      getMyRedemptions: jest.fn().mockResolvedValue([
        {
          id: 'red-1',
          rewardId: 'reward-1',
          costPoints: 100,
          status: 'completed',
        },
      ]),
      redeemReward: jest.fn().mockResolvedValue({
        success: true,
        remainingBalance: 400,
        redemption: {
          id: 'red-1',
          rewardId: 'reward-1',
          costPoints: 100,
          status: 'completed',
        },
      }),
    };

    service = mockRewardsService as unknown as jest.Mocked<RewardsService>;
    controller = new RewardsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listRewards', () => {
    it('returns active rewards list', async () => {
      const res = await controller.listRewards();
      expect(res.length).toBe(1);
      expect(service.listActiveRewards).toHaveBeenCalled();
    });
  });

  describe('getMyRedemptions', () => {
    it('returns learner past redemptions', async () => {
      const req = { user: { userId: 'user-1' } };
      const res = await controller.getMyRedemptions(req as never);
      expect(res.length).toBe(1);
      expect(service.getMyRedemptions).toHaveBeenCalledWith('user-1');
    });
  });

  describe('redeemReward', () => {
    it('passes header idempotency key when provided', async () => {
      const req = { user: { userId: 'user-1' } };
      const res = await controller.redeemReward(
        req as never,
        'reward-1',
        undefined,
        'idemp-header-1',
      );
      expect(res.success).toBe(true);
      expect(service.redeemReward).toHaveBeenCalledWith('user-1', 'reward-1', 'idemp-header-1');
    });

    it('prefers body idempotency key if provided', async () => {
      const req = { user: { userId: 'user-1' } };
      const res = await controller.redeemReward(
        req as never,
        'reward-1',
        { idempotencyKey: 'idemp-body-1' },
        'idemp-header-1',
      );
      expect(res.success).toBe(true);
      expect(service.redeemReward).toHaveBeenCalledWith('user-1', 'reward-1', 'idemp-body-1');
    });
  });
});
