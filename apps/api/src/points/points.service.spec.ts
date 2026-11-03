import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { POINTS_LEDGER_REASONS } from '@sofe/shared';
import { PointsService } from './points.service';

describe('PointsService (Task T3.3)', () => {
  let service: PointsService;

  const mockUserId = new Types.ObjectId().toHexString();
  let userStore: Record<string, unknown> | null = null;
  let ledgerStore: Array<Record<string, unknown>> = [];

  const mockLedgerModel = {
    findOne: jest.fn().mockImplementation((query: Record<string, unknown>) => {
      const match = ledgerStore.find((l) => l['idempotencyKey'] === query['idempotencyKey']);
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((docs: Array<Record<string, unknown>>) => {
      const createdDocs = docs.map((doc) => {
        const item = {
          _id: new Types.ObjectId(),
          createdAt: new Date(),
          ...doc,
        };
        ledgerStore.push(item);
        return item;
      });
      return Promise.resolve(createdDocs);
    }),
    find: jest.fn().mockImplementation((query: Record<string, unknown>) => {
      let filtered = ledgerStore.filter(
        (l) => l['userId']?.toString() === query['userId']?.toString(),
      );
      if (query['reason']) {
        filtered = filtered.filter((l) => l['reason'] === query['reason']);
      }
      return {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation((lim: number) => ({
          lean: () => Promise.resolve(filtered.slice(0, lim)),
        })),
      };
    }),
    countDocuments: jest.fn().mockImplementation((query: Record<string, unknown>) => {
      let filtered = ledgerStore.filter(
        (l) => l['userId']?.toString() === query['userId']?.toString(),
      );
      if (query['reason']) {
        filtered = filtered.filter((l) => l['reason'] === query['reason']);
      }
      return Promise.resolve(filtered.length);
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
          if (
            update['$inc'] &&
            typeof (update['$inc'] as Record<string, number>)['pointsBalance'] === 'number'
          ) {
            const inc = (update['$inc'] as Record<string, number>)['pointsBalance'];
            userStore['pointsBalance'] = ((userStore['pointsBalance'] as number) || 0) + inc;
          }
          return Promise.resolve(userStore);
        }
        return Promise.resolve(null);
      }),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
      inTransaction: jest.fn().mockReturnValue(true),
    }),
  };

  beforeEach(() => {
    ledgerStore = [];
    userStore = {
      _id: new Types.ObjectId(mockUserId),
      pointsBalance: 100,
    };
    jest.clearAllMocks();

    service = new PointsService(
      mockLedgerModel as never,
      mockUserModel as never,
      mockConnection as never,
    );
  });

  describe('awardPoints', () => {
    it('awards points and updates user pointsBalance atomically', async () => {
      const res = await service.awardPoints({
        userId: mockUserId,
        amount: 25,
        reason: POINTS_LEDGER_REASONS.LESSON,
        idempotencyKey: 'idemp-1',
        note: 'Completed video lesson',
      });

      expect(res.alreadyProcessed).toBe(false);
      expect(res.balanceAfter).toBe(125);
      expect(userStore?.['pointsBalance']).toBe(125);
      expect(ledgerStore.length).toBe(1);
      expect(ledgerStore[0]['amount']).toBe(25);
      expect(ledgerStore[0]['balanceAfter']).toBe(125);
      expect(ledgerStore[0]['idempotencyKey']).toBe('idemp-1');
    });

    it('is idempotent: duplicate idempotencyKey returns existing record without double crediting', async () => {
      // First award
      const res1 = await service.awardPoints({
        userId: mockUserId,
        amount: 50,
        reason: POINTS_LEDGER_REASONS.STREAK_BONUS,
        idempotencyKey: 'idemp-bonus-1',
      });
      expect(res1.alreadyProcessed).toBe(false);
      expect(res1.balanceAfter).toBe(150);
      expect(userStore?.['pointsBalance']).toBe(150);

      // Duplicate invocation with identical key
      const res2 = await service.awardPoints({
        userId: mockUserId,
        amount: 50,
        reason: POINTS_LEDGER_REASONS.STREAK_BONUS,
        idempotencyKey: 'idemp-bonus-1',
      });

      expect(res2.alreadyProcessed).toBe(true);
      expect(res2.balanceAfter).toBe(150);
      // Balance remains 150, ledger count remains 1
      expect(userStore?.['pointsBalance']).toBe(150);
      expect(ledgerStore.length).toBe(1);
    });

    it('rejects negative balance: spend/redemption exceeding points balance throws BadRequestException', async () => {
      await expect(
        service.awardPoints({
          userId: mockUserId,
          amount: -150, // current balance is 100
          reason: POINTS_LEDGER_REASONS.REDEEM,
          idempotencyKey: 'redeem-overdraft-1',
        }),
      ).rejects.toThrow(BadRequestException);

      // Ledger has 0 rows and balance is still 100
      expect(ledgerStore.length).toBe(0);
      expect(userStore?.['pointsBalance']).toBe(100);
    });

    it('allows valid redemption when balance is sufficient', async () => {
      const res = await service.awardPoints({
        userId: mockUserId,
        amount: -40,
        reason: POINTS_LEDGER_REASONS.REDEEM,
        idempotencyKey: 'redeem-valid-1',
      });

      expect(res.alreadyProcessed).toBe(false);
      expect(res.balanceAfter).toBe(60);
      expect(userStore?.['pointsBalance']).toBe(60);
      expect(ledgerStore.length).toBe(1);
      expect(ledgerStore[0]['amount']).toBe(-40);
    });

    it('throws NotFoundException when user does not exist', async () => {
      await expect(
        service.awardPoints({
          userId: new Types.ObjectId().toHexString(),
          amount: 25,
          reason: POINTS_LEDGER_REASONS.LESSON,
          idempotencyKey: 'idemp-missing-user',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPointsBalance', () => {
    it('returns the user pointsBalance', async () => {
      const res = await service.getPointsBalance(mockUserId);
      expect(res.pointsBalance).toBe(100);
    });
  });

  describe('getPointsHistory', () => {
    it('returns paginated transactions', async () => {
      await service.awardPoints({
        userId: mockUserId,
        amount: 25,
        reason: POINTS_LEDGER_REASONS.LESSON,
        idempotencyKey: 'h-1',
      });
      await service.awardPoints({
        userId: mockUserId,
        amount: 50,
        reason: POINTS_LEDGER_REASONS.QUIZ,
        idempotencyKey: 'h-2',
      });

      const history = await service.getPointsHistory(mockUserId, { page: 1, limit: 10 });
      expect(history.total).toBe(2);
      expect(history.items.length).toBe(2);
      expect(history.hasMore).toBe(false);
    });
  });
});
