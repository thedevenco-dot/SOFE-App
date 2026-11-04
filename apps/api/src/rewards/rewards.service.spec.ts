import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ERROR_CODES,
  ENROLLMENT_SOURCES,
  ENROLLMENT_STATUSES,
  REWARD_REDEMPTION_STATUSES,
  REWARD_TYPES,
} from '@sofe/shared';
import { RewardsService } from './rewards.service';

describe('RewardsService', () => {
  let service: RewardsService;

  const mockUserId = new Types.ObjectId().toString();
  const mockCourseId = new Types.ObjectId().toString();
  const mockRewardId = new Types.ObjectId().toString();

  let userStore: Record<string, unknown> | null;
  let rewardStore: Record<string, unknown> | null;
  let redemptionsStore: Array<Record<string, unknown>>;
  let enrollmentsStore: Array<Record<string, unknown>>;
  let pointsLedgerStore: Array<Record<string, unknown>>;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
    inTransaction: jest.fn().mockReturnValue(true),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  const mockRewardModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockImplementation(() => {
            return Promise.resolve(rewardStore ? [rewardStore] : []);
          }),
        }),
      }),
    }),
    findById: jest.fn().mockImplementation((id: string | Types.ObjectId) => {
      if (rewardStore && rewardStore['_id']?.toString() === id.toString()) {
        return Promise.resolve(rewardStore);
      }
      return Promise.resolve(null);
    }),
    findOneAndUpdate: jest
      .fn()
      .mockImplementation((filter: Record<string, unknown>, update: Record<string, unknown>) => {
        if (!rewardStore) return Promise.resolve(null);
        if (filter['stock'] && typeof filter['stock'] === 'object') {
          const stockGt = (filter['stock'] as Record<string, number>)['$gt'];
          if (typeof stockGt === 'number' && (rewardStore['stock'] as number) <= stockGt) {
            return Promise.resolve(null);
          }
        }
        if (
          update['$inc'] &&
          typeof (update['$inc'] as Record<string, number>)['stock'] === 'number'
        ) {
          rewardStore['stock'] =
            (rewardStore['stock'] as number) + (update['$inc'] as Record<string, number>)['stock'];
        }
        return Promise.resolve(rewardStore);
      }),
  };

  const mockRedemptionModel = {
    find: jest.fn().mockImplementation((filter: { userId?: Types.ObjectId }) => ({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockImplementation(() => {
            const matches = redemptionsStore.filter(
              (r) => r['userId']?.toString() === filter.userId?.toString(),
            );
            return Promise.resolve(matches);
          }),
        }),
      }),
    })),
    findOne: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
      if (filter['idempotencyKey']) {
        const found = redemptionsStore.find(
          (r) => r['idempotencyKey'] === filter['idempotencyKey'],
        );
        return {
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(found || null),
          }),
        };
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((docs: Array<Record<string, unknown>>) => {
      const created = docs.map((d) => {
        const row = {
          _id: new Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...d,
        };
        redemptionsStore.push(row);
        return row;
      });
      return Promise.resolve(created);
    }),
  };

  const mockEnrollmentModel = {
    findOne: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
      const found = enrollmentsStore.find(
        (e) =>
          e['userId']?.toString() === filter['userId']?.toString() &&
          e['courseId']?.toString() === filter['courseId']?.toString(),
      );
      return Promise.resolve(found || null);
    }),
    create: jest.fn().mockImplementation((docs: Array<Record<string, unknown>>) => {
      const created = docs.map((d) => {
        const row = {
          _id: new Types.ObjectId(),
          save: jest.fn().mockResolvedValue(true),
          ...d,
        };
        enrollmentsStore.push(row);
        return row;
      });
      return Promise.resolve(created);
    }),
  };

  const mockUserModel = {
    findById: jest.fn().mockImplementation((id: string | Types.ObjectId) => {
      if (userStore && userStore['_id']?.toString() === id.toString()) {
        return Promise.resolve(userStore);
      }
      return Promise.resolve(null);
    }),
  };

  const mockPointsService = {
    awardPoints: jest
      .fn()
      .mockImplementation((dto: { amount: number; userId: string; idempotencyKey: string }) => {
        if (!userStore) throw new NotFoundException();
        const current = (userStore['pointsBalance'] as number) || 0;
        const after = current + dto.amount;
        if (dto.amount < 0 && after < 0) {
          throw new BadRequestException({
            code: ERROR_CODES.INSUFFICIENT_POINTS,
            message: 'Insufficient points balance',
          });
        }
        userStore['pointsBalance'] = after;
        const ledgerEntry = {
          _id: new Types.ObjectId(),
          userId: dto.userId,
          amount: dto.amount,
          balanceAfter: after,
          idempotencyKey: dto.idempotencyKey,
        };
        pointsLedgerStore.push(ledgerEntry);
        return Promise.resolve({
          transaction: ledgerEntry,
          balanceAfter: after,
          alreadyProcessed: false,
        });
      }),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userStore = {
      _id: new Types.ObjectId(mockUserId),
      pointsBalance: 1000,
    };

    rewardStore = {
      _id: new Types.ObjectId(mockRewardId),
      title: 'Free Founder Course Access',
      description: 'Unlock complete zero-to-one curriculum',
      type: REWARD_TYPES.COURSE_ACCESS,
      costPoints: 500,
      courseId: new Types.ObjectId(mockCourseId),
      stock: 10,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    redemptionsStore = [];
    enrollmentsStore = [];
    pointsLedgerStore = [];

    service = new RewardsService(
      mockRewardModel as never,
      mockRedemptionModel as never,
      mockEnrollmentModel as never,
      mockUserModel as never,
      mockConnection as never,
      mockPointsService as never,
    );
  });

  describe('listActiveRewards', () => {
    it('returns formatted active rewards', async () => {
      const result = await service.listActiveRewards();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockRewardId);
      expect(result[0].costPoints).toBe(500);
      expect(result[0].type).toBe(REWARD_TYPES.COURSE_ACCESS);
    });
  });

  describe('redeemReward (Course Access)', () => {
    it('successfully executes atomic redemption: decrements stock, deducts points, creates enrollment and redemption', async () => {
      const result = await service.redeemReward(mockUserId, mockRewardId, 'idemp-key-1');

      expect(result.success).toBe(true);
      expect(result.remainingBalance).toBe(500);
      expect(result.redemption.costPoints).toBe(500);
      expect(result.redemption.status).toBe(REWARD_REDEMPTION_STATUSES.COMPLETED);
      expect(result.enrollment?.courseId).toBe(mockCourseId);

      // Verify transaction lifecycle
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();

      // Verify stock was decremented
      expect(rewardStore?.['stock']).toBe(9);

      // Verify user points balance
      expect(userStore?.['pointsBalance']).toBe(500);

      // Verify enrollment was created
      expect(enrollmentsStore.length).toBe(1);
      expect(enrollmentsStore[0]['source']).toBe(ENROLLMENT_SOURCES.POINTS);
      expect(enrollmentsStore[0]['status']).toBe(ENROLLMENT_STATUSES.ACTIVE);

      // Verify redemption document created
      expect(redemptionsStore.length).toBe(1);
      expect(redemptionsStore[0]['costPoints']).toBe(500);
    });

    it('is idempotent: identical idempotencyKey returns existing completed redemption without double deduction', async () => {
      // First attempt
      const res1 = await service.redeemReward(mockUserId, mockRewardId, 'idemp-repeat-1');
      expect(res1.success).toBe(true);
      expect(userStore?.['pointsBalance']).toBe(500);
      expect(rewardStore?.['stock']).toBe(9);
      expect(enrollmentsStore.length).toBe(1);
      expect(redemptionsStore.length).toBe(1);

      // Duplicate request with identical idempotencyKey
      const res2 = await service.redeemReward(mockUserId, mockRewardId, 'idemp-repeat-1');
      expect(res2.success).toBe(true);
      expect(res2.idempotent).toBe(true);
      expect(res2.message).toBe('Reward already redeemed');

      // Points must not be deducted again
      expect(userStore?.['pointsBalance']).toBe(500);
      expect(rewardStore?.['stock']).toBe(9);
      expect(enrollmentsStore.length).toBe(1);
      expect(redemptionsStore.length).toBe(1);
    });

    it('rejects with ConflictException if user is already enrolled in the course', async () => {
      // Simulate existing enrollment
      enrollmentsStore.push({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUserId),
        courseId: new Types.ObjectId(mockCourseId),
        status: ENROLLMENT_STATUSES.ACTIVE,
      });

      await expect(
        service.redeemReward(mockUserId, mockRewardId, 'idemp-conflict-1'),
      ).rejects.toThrow(ConflictException);

      // State is completely untouched
      expect(userStore?.['pointsBalance']).toBe(1000);
      expect(rewardStore?.['stock']).toBe(10);
      expect(redemptionsStore.length).toBe(0);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('rejects with BadRequestException if user has insufficient points balance', async () => {
      // Give user only 300 points (cost is 500)
      if (userStore) userStore['pointsBalance'] = 300;

      await expect(service.redeemReward(mockUserId, mockRewardId, 'idemp-poor-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(userStore?.['pointsBalance']).toBe(300);
      expect(rewardStore?.['stock']).toBe(10);
      expect(enrollmentsStore.length).toBe(0);
      expect(redemptionsStore.length).toBe(0);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('rejects with BadRequestException if reward is out of stock', async () => {
      if (rewardStore) rewardStore['stock'] = 0;

      await expect(service.redeemReward(mockUserId, mockRewardId, 'idemp-stock-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(userStore?.['pointsBalance']).toBe(1000);
      expect(enrollmentsStore.length).toBe(0);
      expect(redemptionsStore.length).toBe(0);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('rejects with NotFoundException if reward does not exist or is inactive', async () => {
      if (rewardStore) rewardStore['status'] = 'inactive';

      await expect(
        service.redeemReward(mockUserId, mockRewardId, 'idemp-inactive-1'),
      ).rejects.toThrow(NotFoundException);

      expect(userStore?.['pointsBalance']).toBe(1000);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('rolls back transaction cleanly when an internal database error occurs during enrollment creation', async () => {
      mockEnrollmentModel.create.mockRejectedValueOnce(
        new Error('Database disk error during enrollment creation'),
      );

      await expect(service.redeemReward(mockUserId, mockRewardId, 'idemp-fail-1')).rejects.toThrow(
        'Database disk error during enrollment creation',
      );

      // Abort transaction must have been called
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('redeemReward (Badge / Coupon)', () => {
    it('successfully redeems non-course reward without creating enrollment', async () => {
      const couponRewardId = new Types.ObjectId().toString();
      rewardStore = {
        _id: new Types.ObjectId(couponRewardId),
        title: '50% Discount Coupon',
        description: 'Get half off on your next purchase',
        type: REWARD_TYPES.COUPON,
        costPoints: 200,
        couponCode: 'FOUNDER50',
        stock: null, // Unlimited stock
        status: 'active',
      };

      const result = await service.redeemReward(mockUserId, couponRewardId, 'coupon-red-1');

      expect(result.success).toBe(true);
      expect(result.remainingBalance).toBe(800);
      expect(result.redemption.metadata?.['couponCode']).toBe('FOUNDER50');
      expect(result.enrollment).toBeUndefined();
      expect(enrollmentsStore.length).toBe(0);
      expect(redemptionsStore.length).toBe(1);
    });
  });

  describe('getMyRedemptions', () => {
    it('returns learner redemption history', async () => {
      redemptionsStore.push({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockUserId),
        rewardId: new Types.ObjectId(mockRewardId),
        costPoints: 500,
        ledgerId: new Types.ObjectId(),
        status: REWARD_REDEMPTION_STATUSES.COMPLETED,
        createdAt: new Date(),
      });

      const list = await service.getMyRedemptions(mockUserId);
      expect(list.length).toBe(1);
      expect(list[0].costPoints).toBe(500);
      expect(list[0].status).toBe(REWARD_REDEMPTION_STATUSES.COMPLETED);
    });
  });
});
