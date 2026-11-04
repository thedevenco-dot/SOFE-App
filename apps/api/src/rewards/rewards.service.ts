import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import {
  ERROR_CODES,
  POINTS_LEDGER_REASONS,
  ENROLLMENT_SOURCES,
  ENROLLMENT_STATUSES,
  REWARD_REDEMPTION_STATUSES,
  REWARD_TYPES,
  type RewardRedemptionResponseDto,
} from '@sofe/shared';
import {
  Reward,
  RewardDocument,
  RewardRedemption,
  RewardRedemptionDocument,
  Enrollment,
  EnrollmentDocument,
  User,
  UserDocument,
} from '../database/schemas';
import { PointsService } from '../points/points.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
    @InjectModel(RewardRedemption.name)
    private readonly redemptionModel: Model<RewardRedemptionDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly pointsService: PointsService,
  ) {}

  /**
   * Returns all active rewards sorted by point cost
   */
  async listActiveRewards() {
    const rewards = await this.rewardModel
      .find({ status: 'active' })
      .sort({ costPoints: 1 })
      .populate('courseId', 'title slug thumbnail')
      .lean();

    return rewards.map((r) => {
      const course = r.courseId as unknown as {
        _id?: Types.ObjectId;
        title?: string;
        slug?: string;
        thumbnail?: string;
      };
      return {
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        type: r.type,
        costPoints: r.costPoints,
        pointsCost: r.costPoints, // Compatibility alias
        courseId: course?._id ? course._id.toString() : r.courseId?.toString(),
        courseTitle: course?.title,
        courseSlug: course?.slug,
        courseThumbnail: course?.thumbnail,
        couponCode: r.couponCode,
        stock: r.stock,
        status: r.status,
        createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
      };
    });
  }

  /**
   * Returns learner's redemption history
   */
  async getMyRedemptions(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid userId format',
      });
    }

    const items = await this.redemptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('rewardId', 'title type costPoints courseId couponCode')
      .lean();

    return items.map((item) => this.formatRedemption(item));
  }

  /**
   * Idempotent atomic reward redemption from FLOWS.md F6.
   * Transaction: check balance, negative ledger entry, create enrollment, decrement stock, save rewardRedemptions.
   */
  async redeemReward(
    userId: string,
    rewardId: string,
    idempotencyKey?: string,
  ): Promise<RewardRedemptionResponseDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid user ID format',
      });
    }

    if (!Types.ObjectId.isValid(rewardId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    const trimmedKey = idempotencyKey?.trim() || undefined;

    // 0. Idempotency Check
    if (trimmedKey) {
      const existing = await this.redemptionModel
        .findOne({ idempotencyKey: trimmedKey })
        .populate('rewardId', 'title type costPoints courseId couponCode')
        .lean();

      if (existing) {
        const u = await this.userModel.findById(userId);
        return {
          success: true,
          idempotent: true,
          message: 'Reward already redeemed',
          redemption: this.formatRedemption(existing),
          enrollment: existing.enrollmentId
            ? {
                id: existing.enrollmentId.toString(),
                courseId:
                  (existing.metadata?.courseId as string) ||
                  (
                    existing.rewardId as unknown as { courseId?: Types.ObjectId }
                  )?.courseId?.toString() ||
                  '',
              }
            : undefined,
          remainingBalance: u?.pointsBalance || 0,
        };
      }
    }

    // 1. Fetch & Validate Reward
    const reward = await this.rewardModel.findById(rewardId);
    if (!reward || reward.status !== 'active') {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found or no longer active',
      });
    }

    // Stock check
    if (
      reward.stock !== null &&
      reward.stock !== undefined &&
      reward.stock !== -1 &&
      reward.stock <= 0
    ) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'This reward is currently out of stock',
      });
    }

    // 2. Fetch User & Balance Check
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    }

    const currentPoints = user.pointsBalance || 0;
    if (currentPoints < reward.costPoints) {
      throw new BadRequestException({
        code: ERROR_CODES.INSUFFICIENT_POINTS,
        message: `Insufficient points. You need ${reward.costPoints} pts but have ${currentPoints} pts.`,
      });
    }

    // 3. Course Access Check (Edge case: Already enrolled)
    if (reward.type === REWARD_TYPES.COURSE_ACCESS) {
      if (!reward.courseId) {
        throw new BadRequestException({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'Reward course configuration is missing',
        });
      }

      const existingEnrollment = await this.enrollmentModel.findOne({
        userId: new Types.ObjectId(userId),
        courseId: reward.courseId,
        status: { $ne: ENROLLMENT_STATUSES.REVOKED },
      });

      if (existingEnrollment) {
        throw new ConflictException({
          code: ERROR_CODES.ALREADY_ENROLLED,
          message: 'You are already enrolled in this course',
        });
      }
    }

    // 4. Atomic Execution Function
    const executeInSession = async (session?: ClientSession) => {
      // 4a. Atomically decrement stock if finite
      if (reward.stock !== null && reward.stock !== undefined && reward.stock !== -1) {
        const stockFilter = { _id: reward._id, stock: { $gt: 0 } };
        const updatedReward = await this.rewardModel.findOneAndUpdate(
          stockFilter,
          { $inc: { stock: -1 } },
          session ? { session, new: true } : { new: true },
        );
        if (!updatedReward) {
          throw new BadRequestException({
            code: ERROR_CODES.VALIDATION_FAILED,
            message: 'This reward is currently out of stock',
          });
        }
      }

      // 4b. Insert negative points ledger entry
      const ledgerKey = trimmedKey
        ? `redeem:${trimmedKey}`
        : `redeem:${userId}:${rewardId}:${Date.now()}`;

      const ledgerResult = await this.pointsService.awardPoints(
        {
          userId,
          amount: -reward.costPoints,
          reason: POINTS_LEDGER_REASONS.REDEEM,
          idempotencyKey: ledgerKey,
          refType: 'reward',
          refId: reward._id.toString(),
          note: `Redeemed: ${reward.title}`,
        },
        session,
      );

      // 4c. Create Enrollment if course_access
      let enrollmentDoc: EnrollmentDocument | null = null;
      if (reward.type === REWARD_TYPES.COURSE_ACCESS && reward.courseId) {
        const [createdEnrollment] = await this.enrollmentModel.create(
          [
            {
              userId: new Types.ObjectId(userId),
              courseId: reward.courseId,
              source: ENROLLMENT_SOURCES.POINTS,
              status: ENROLLMENT_STATUSES.ACTIVE,
              progress: {
                completedLessonCount: 0,
                percent: 0,
                lastAccessedAt: new Date(),
              },
            },
          ],
          session ? { session } : {},
        );
        enrollmentDoc = createdEnrollment;
      }

      // 4d. Create RewardRedemption record
      const [redemptionDoc] = await this.redemptionModel.create(
        [
          {
            userId: new Types.ObjectId(userId),
            rewardId: reward._id,
            costPoints: reward.costPoints,
            ledgerId: ledgerResult.transaction._id,
            enrollmentId: enrollmentDoc ? enrollmentDoc._id : undefined,
            status: REWARD_REDEMPTION_STATUSES.COMPLETED,
            idempotencyKey: trimmedKey,
            metadata: {
              rewardTitle: reward.title,
              rewardType: reward.type,
              couponCode: reward.couponCode,
              courseId: reward.courseId ? reward.courseId.toString() : undefined,
            },
          },
        ],
        session ? { session } : {},
      );

      // 4e. Link redemptionId on enrollment
      if (enrollmentDoc) {
        enrollmentDoc.redemptionId = redemptionDoc._id;
        await enrollmentDoc.save(session ? { session } : {});
      }

      return {
        redemption: redemptionDoc,
        enrollment: enrollmentDoc,
        balanceAfter: ledgerResult.balanceAfter,
      };
    };

    // 5. Try Mongo Session Transaction with graceful standalone fallback
    let session: ClientSession | null = null;
    try {
      session = await this.connection.startSession();
      session.startTransaction();

      const result = await executeInSession(session);
      await session.commitTransaction();

      return {
        success: true,
        redemption: this.formatRedemption(result.redemption),
        enrollment: result.enrollment
          ? {
              id: result.enrollment._id.toString(),
              courseId: result.enrollment.courseId.toString(),
            }
          : undefined,
        remainingBalance: result.balanceAfter,
      };
    } catch (err: unknown) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }

      // Duplicate key error from concurrent request with same idempotencyKey
      if ((err as { code?: number })?.code === 11000 && trimmedKey) {
        const existing = await this.redemptionModel.findOne({
          idempotencyKey: trimmedKey,
        });
        if (existing) {
          const u = await this.userModel.findById(userId);
          return {
            success: true,
            idempotent: true,
            message: 'Reward already redeemed',
            redemption: this.formatRedemption(existing),
            enrollment: existing.enrollmentId
              ? {
                  id: existing.enrollmentId.toString(),
                  courseId: (existing.metadata?.courseId as string) || '',
                }
              : undefined,
            remainingBalance: u?.pointsBalance || 0,
          };
        }
      }

      // Fallback for standalone / single-node MongoDB without replica-set transactions
      if (
        (err as Error)?.message?.includes('Transactions are not supported') ||
        (err as Error)?.message?.includes('replica set')
      ) {
        const result = await executeInSession();
        return {
          success: true,
          redemption: this.formatRedemption(result.redemption),
          enrollment: result.enrollment
            ? {
                id: result.enrollment._id.toString(),
                courseId: result.enrollment.courseId.toString(),
              }
            : undefined,
          remainingBalance: result.balanceAfter,
        };
      }

      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  private formatRedemption(item: unknown) {
    const r = item as {
      _id?: Types.ObjectId;
      id?: string;
      userId: Types.ObjectId | string;
      rewardId: Types.ObjectId | { _id?: Types.ObjectId } | string;
      costPoints: number;
      ledgerId: Types.ObjectId | string;
      enrollmentId?: Types.ObjectId | string;
      status: string;
      idempotencyKey?: string;
      metadata?: Record<string, unknown>;
      createdAt?: Date;
    };

    const id = r._id ? r._id.toString() : r.id || '';
    const userId = r.userId instanceof Types.ObjectId ? r.userId.toString() : String(r.userId);
    const rewardId =
      typeof r.rewardId === 'object' && r.rewardId !== null && '_id' in r.rewardId
        ? (r.rewardId as { _id?: Types.ObjectId })._id?.toString() || ''
        : String(r.rewardId);
    const ledgerId =
      r.ledgerId instanceof Types.ObjectId ? r.ledgerId.toString() : String(r.ledgerId);
    const enrollmentId = r.enrollmentId ? r.enrollmentId.toString() : undefined;

    return {
      id,
      userId,
      rewardId,
      costPoints: r.costPoints,
      ledgerId,
      enrollmentId,
      status: r.status,
      idempotencyKey: r.idempotencyKey,
      metadata: r.metadata,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    };
  }
}
