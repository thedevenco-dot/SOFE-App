import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  ACHIEVEMENT_RULE_TYPES,
  ENROLLMENT_STATUSES,
  type CreateAchievementDto,
  type UpdateAchievementDto,
  type LearnerAchievementsResponseDto,
  type LearnerAchievementItemDto,
} from '@sofe/shared';
import {
  Achievement,
  AchievementDocument,
  UserAchievement,
  UserAchievementDocument,
  User,
  UserDocument,
  PracticeAttempt,
  PracticeAttemptDocument,
  LessonProgress,
  LessonProgressDocument,
  Enrollment,
  EnrollmentDocument,
} from '../database/schemas';
import { SEED_ACHIEVEMENTS } from '../database/seeds/data/achievements.data';

export interface UnlockedAchievementInfo {
  _id: Types.ObjectId;
  key: string;
  title: string;
  tier: string;
  iconUrl: string;
}

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement.name)
    private readonly achievementModel: Model<AchievementDocument>,
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievementDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PracticeAttempt.name)
    private readonly practiceAttemptModel: Model<PracticeAttemptDocument>,
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  /**
   * Evaluates rules and awards any newly qualified achievements to the user.
   * Returns array of newly unlocked achievements.
   */
  async checkAndUnlock(userId: string): Promise<UnlockedAchievementInfo[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId);
    if (!user) {
      return [];
    }

    const activeAchievements = await this.achievementModel
      .find({ status: 'active' })
      .sort({ order: 1 })
      .lean();

    const unlocked = await this.userAchievementModel.find({ userId: uId }).lean();
    const unlockedKeys = new Set(unlocked.map((u) => u.achievementKey));

    const newlyUnlocked: UnlockedAchievementInfo[] = [];

    // Pre-calculate user metrics once for all rule evaluations
    const userMetrics = await this.collectUserMetrics(userId, user);

    for (const ach of activeAchievements) {
      if (unlockedKeys.has(ach.key)) {
        continue;
      }

      const { current, satisfied } = this.evaluateRule(
        ach.rule.type,
        ach.rule.threshold,
        userMetrics,
      );

      if (satisfied) {
        try {
          await this.userAchievementModel.create([
            {
              userId: uId,
              achievementId: ach._id,
              achievementKey: ach.key,
              unlockedAt: new Date(),
              progressSnapshot: {
                current,
                threshold: ach.rule.threshold,
              },
            },
          ]);
          newlyUnlocked.push({
            _id: ach._id,
            key: ach.key,
            title: ach.title,
            tier: ach.tier,
            iconUrl: ach.iconUrl,
          });
          unlockedKeys.add(ach.key);
        } catch (err: unknown) {
          // If race condition duplicate key (11000), ignore safely
          if ((err as { code?: number })?.code !== 11000) {
            throw err;
          }
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Retrieves all active achievements for a learner with their unlock state and progress.
   */
  async listLearnerAchievements(userId: string): Promise<LearnerAchievementsResponseDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid userId format',
      });
    }

    // Lazy evaluation to unlock any newly satisfied achievements
    await this.checkAndUnlock(userId);

    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId);
    const userMetrics = user ? await this.collectUserMetrics(userId, user) : null;

    const achievements = await this.achievementModel
      .find({ status: 'active' })
      .sort({ order: 1 })
      .lean();

    const unlockedList = await this.userAchievementModel.find({ userId: uId }).lean();

    const unlockedMap = new Map(unlockedList.map((u) => [u.achievementKey, u]));

    const items: LearnerAchievementItemDto[] = achievements.map((ach) => {
      const unlockedRecord = unlockedMap.get(ach.key);
      const isUnlocked = !!unlockedRecord;

      let current = 0;
      let percent = 0;

      if (isUnlocked) {
        current = ach.rule.threshold;
        percent = 100;
      } else if (userMetrics) {
        const evalResult = this.evaluateRule(ach.rule.type, ach.rule.threshold, userMetrics);
        current = evalResult.current;
        percent = Math.min(100, Math.max(0, Math.round((current / ach.rule.threshold) * 100)));
      }

      return {
        id: ach._id.toString(),
        key: ach.key,
        title: ach.title,
        description: ach.description,
        iconUrl: ach.iconUrl,
        tier: ach.tier,
        rule: {
          type: ach.rule.type,
          threshold: ach.rule.threshold,
        },
        status: ach.status,
        order: ach.order,
        createdAt: ach.createdAt ? ach.createdAt.toISOString() : undefined,
        updatedAt: ach.updatedAt ? ach.updatedAt.toISOString() : undefined,
        unlocked: isUnlocked,
        unlockedAt: unlockedRecord?.unlockedAt
          ? new Date(unlockedRecord.unlockedAt).toISOString()
          : undefined,
        progress: {
          current,
          threshold: ach.rule.threshold,
          percent,
        },
      };
    });

    return {
      totalCount: items.length,
      unlockedCount: unlockedList.length,
      items,
    };
  }

  // ==========================================
  // Admin Methods (CS25)
  // ==========================================

  async listAllAdmin(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }

    const items = await this.achievementModel.find(filter).sort({ order: 1, createdAt: -1 }).lean();

    // Aggregate unlock counts
    const unlockCounts = await this.userAchievementModel.aggregate([
      { $group: { _id: '$achievementKey', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(unlockCounts.map((c) => [c._id as string, c.count as number]));

    return items.map((ach) => ({
      id: ach._id.toString(),
      key: ach.key,
      title: ach.title,
      description: ach.description,
      iconUrl: ach.iconUrl,
      tier: ach.tier,
      rule: ach.rule,
      status: ach.status,
      order: ach.order,
      unlockedCount: countMap.get(ach.key) || 0,
      createdAt: ach.createdAt ? ach.createdAt.toISOString() : undefined,
      updatedAt: ach.updatedAt ? ach.updatedAt.toISOString() : undefined,
    }));
  }

  async createAchievement(dto: CreateAchievementDto) {
    const existing = await this.achievementModel.findOne({ key: dto.key });
    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.CONFLICT,
        message: `Achievement with key "${dto.key}" already exists`,
      });
    }

    const created = await this.achievementModel.create(dto);
    return {
      id: created._id.toString(),
      key: created.key,
      title: created.title,
      description: created.description,
      iconUrl: created.iconUrl,
      tier: created.tier,
      rule: created.rule,
      status: created.status,
      order: created.order,
      createdAt: created.createdAt?.toISOString(),
      updatedAt: created.updatedAt?.toISOString(),
    };
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Achievement not found',
      });
    }

    const updated = await this.achievementModel.findByIdAndUpdate(id, { $set: dto }, { new: true });

    if (!updated) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Achievement not found',
      });
    }

    return {
      id: updated._id.toString(),
      key: updated.key,
      title: updated.title,
      description: updated.description,
      iconUrl: updated.iconUrl,
      tier: updated.tier,
      rule: updated.rule,
      status: updated.status,
      order: updated.order,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    };
  }

  async deleteAchievement(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Achievement not found',
      });
    }

    const deleted = await this.achievementModel.findByIdAndUpdate(
      id,
      { $set: { status: 'inactive' } },
      { new: true },
    );

    if (!deleted) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Achievement not found',
      });
    }

    return { success: true };
  }

  async seedDefaults() {
    let seeded = 0;
    for (const item of SEED_ACHIEVEMENTS) {
      await this.achievementModel.findOneAndUpdate(
        { key: item.key },
        { $set: item },
        { upsert: true, new: true },
      );
      seeded++;
    }
    return { success: true, count: seeded };
  }

  // ==========================================
  // Internal Rule Calculation Helpers
  // ==========================================

  private async collectUserMetrics(userId: string, user: UserDocument) {
    const uId = new Types.ObjectId(userId);

    // 1. Streak
    const streak = user.streak?.current || 0;

    // 2. Completed Quizzes (count completed attempts)
    const completedQuizzes = await this.practiceAttemptModel.countDocuments({
      userId: uId,
      status: 'completed',
    });

    // 3. Learning Time Percentile
    const userProgress = await this.lessonProgressModel.find({ userId: uId }).lean();
    const userWatchedSec = userProgress.reduce((acc, p) => acc + (p.watchedSec || 0), 0);

    // Percentile ranking across learners
    let percentile = 0;
    if (userWatchedSec > 0) {
      const totals = await this.lessonProgressModel.aggregate([
        { $group: { _id: '$userId', totalWatchedSec: { $sum: '$watchedSec' } } },
        { $sort: { totalWatchedSec: 1 } },
      ]);

      if (totals.length <= 1) {
        percentile = 100;
      } else {
        const rank = totals.findIndex((t) => t._id?.toString() === userId);
        percentile = rank >= 0 ? Math.round(((rank + 1) / totals.length) * 100) : 0;
      }
    }

    // 4. Completed Courses
    const completedCourses = await this.enrollmentModel.countDocuments({
      userId: uId,
      status: ENROLLMENT_STATUSES.COMPLETED,
    });

    return {
      streak,
      completedQuizzes,
      percentile,
      completedCourses,
    };
  }

  private evaluateRule(
    type: string,
    threshold: number,
    metrics: {
      streak: number;
      completedQuizzes: number;
      percentile: number;
      completedCourses: number;
    },
  ): { current: number; satisfied: boolean } {
    switch (type) {
      case ACHIEVEMENT_RULE_TYPES.STREAK_DAYS: {
        const current = metrics.streak;
        return { current, satisfied: current >= threshold };
      }
      case ACHIEVEMENT_RULE_TYPES.QUIZZES_COMPLETED: {
        const current = metrics.completedQuizzes;
        return { current, satisfied: current >= threshold };
      }
      case ACHIEVEMENT_RULE_TYPES.LEARNING_TIME_PERCENTILE: {
        const current = metrics.percentile;
        return { current, satisfied: current >= threshold };
      }
      case ACHIEVEMENT_RULE_TYPES.COURSES_COMPLETED: {
        const current = metrics.completedCourses;
        return { current, satisfied: current >= threshold };
      }
      case ACHIEVEMENT_RULE_TYPES.MANUAL:
      default:
        return { current: 0, satisfied: false };
    }
  }
}
