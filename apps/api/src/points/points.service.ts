import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { ERROR_CODES, type AwardPointsDto, type PointsHistoryQueryDto } from '@sofe/shared';
import { PointsLedger, PointsLedgerDocument, User, UserDocument } from '../database/schemas';

export interface AwardPointsResult {
  transaction: PointsLedgerDocument;
  balanceAfter: number;
  alreadyProcessed: boolean;
}

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(PointsLedger.name)
    private readonly ledgerModel: Model<PointsLedgerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Idempotent & Atomic Points Award / Spend Function
   * Rule: Write the ledger row and update user.pointsBalance in one transaction;
   * the balance must NEVER go below zero.
   * If the idempotencyKey exists, do nothing and return the existing record.
   */
  async awardPoints(
    dto: AwardPointsDto,
    externalSession?: ClientSession,
  ): Promise<AwardPointsResult> {
    const uId = new Types.ObjectId(dto.userId);

    // 1. Idempotency Check: if key already exists, return existing entry immediately
    const existing = await this.ledgerModel.findOne({
      idempotencyKey: dto.idempotencyKey,
    });
    if (existing) {
      return {
        transaction: existing,
        balanceAfter: existing.balanceAfter,
        alreadyProcessed: true,
      };
    }

    // 2. User Lookup & Negative Balance Protection
    const user = await this.userModel.findById(uId);
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    }

    const currentBalance = user.pointsBalance || 0;
    const amount = Math.round(dto.amount);
    const balanceAfter = currentBalance + amount;

    if (amount < 0 && balanceAfter < 0) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: `Insufficient points balance. Current balance is ${currentBalance}, cannot deduct ${Math.abs(amount)}.`,
      });
    }

    // 3. Atomic execution
    const executeInSession = async (session?: ClientSession) => {
      const [created] = await this.ledgerModel.create(
        [
          {
            userId: uId,
            amount,
            balanceAfter,
            reason: dto.reason,
            refType: dto.refType,
            refId: dto.refId,
            idempotencyKey: dto.idempotencyKey,
            note: dto.note,
          },
        ],
        session ? { session } : {},
      );

      await this.userModel.findByIdAndUpdate(
        uId,
        { $inc: { pointsBalance: amount } },
        session ? { session } : {},
      );

      return created;
    };

    if (externalSession) {
      const created = await executeInSession(externalSession);
      return {
        transaction: created,
        balanceAfter,
        alreadyProcessed: false,
      };
    }

    // Try replica-set session transaction if available, fallback gracefully in local non-replica test environments
    let session: ClientSession | null = null;
    try {
      session = await this.connection.startSession();
      session.startTransaction();

      const created = await executeInSession(session);
      await session.commitTransaction();

      return {
        transaction: created,
        balanceAfter,
        alreadyProcessed: false,
      };
    } catch (err: unknown) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }

      // If error is duplicate key from concurrent call that beat this one
      if ((err as { code?: number })?.code === 11000) {
        const found = await this.ledgerModel.findOne({
          idempotencyKey: dto.idempotencyKey,
        });
        if (found) {
          return {
            transaction: found,
            balanceAfter: found.balanceAfter,
            alreadyProcessed: true,
          };
        }
      }

      // If transaction failed because MongoDB instance does not support replica set (e.g. single-node standalone in tests)
      if (
        (err as Error)?.message?.includes('Transactions are not supported') ||
        (err as Error)?.message?.includes('replica set')
      ) {
        const created = await executeInSession();
        return {
          transaction: created,
          balanceAfter,
          alreadyProcessed: false,
        };
      }

      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  async getPointsBalance(userId: string): Promise<{ pointsBalance: number }> {
    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId);
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    }
    return {
      pointsBalance: user.pointsBalance || 0,
    };
  }

  async getPointsHistory(userId: string, query: PointsHistoryQueryDto) {
    const uId = new Types.ObjectId(userId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: uId };
    if (query.reason) {
      filter.reason = query.reason;
    }

    const [items, total] = await Promise.all([
      this.ledgerModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.ledgerModel.countDocuments(filter),
    ]);

    const hasMore = skip + items.length < total;

    return {
      items: items.map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        amount: item.amount,
        balanceAfter: item.balanceAfter,
        reason: item.reason,
        refType: item.refType,
        refId: item.refId,
        idempotencyKey: item.idempotencyKey,
        note: item.note,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      })),
      total,
      page,
      limit,
      hasMore,
    };
  }
}
