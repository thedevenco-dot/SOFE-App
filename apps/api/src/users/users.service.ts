import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  ENROLLMENT_STATUSES,
  type PatchMeInput,
  type ApiSuccessEnvelope,
  type UserStatsResponseDto,
  type PublicProfileResponseDto,
} from '@sofe/shared';
import {
  User,
  UserDocument,
  Enrollment,
  EnrollmentDocument,
  LessonProgress,
  LessonProgressDocument,
  PracticeAttempt,
  PracticeAttemptDocument,
  Achievement,
  AchievementDocument,
  UserAchievement,
  UserAchievementDocument,
  Project,
  ProjectDocument,
} from '../database/schemas';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(PracticeAttempt.name)
    private readonly practiceAttemptModel: Model<PracticeAttemptDocument>,
    @InjectModel(Achievement.name)
    private readonly achievementModel: Model<AchievementDocument>,
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievementDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async getMe(user: UserDocument): Promise<ApiSuccessEnvelope<UserDocument>> {
    return {
      data: user,
    };
  }

  async updateMe(
    user: UserDocument,
    updateData: PatchMeInput,
  ): Promise<ApiSuccessEnvelope<UserDocument>> {
    // Always filter by authenticated user ID from token
    const updated = await this.userModel.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User profile not found',
      });
    }

    return {
      data: updated,
    };
  }

  /**
   * Aggregates real-time learning stats for PF1 Progress & PF5 Stats Detail
   */
  async getMyStats(userId: string): Promise<UserStatsResponseDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid userId format',
      });
    }

    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId).lean();
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    }

    // 1. Course Enrollment Progress
    const enrollments = await this.enrollmentModel
      .find({
        userId: uId,
        status: { $ne: ENROLLMENT_STATUSES.REVOKED },
      })
      .lean();

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(
      (e) => e.status === ENROLLMENT_STATUSES.COMPLETED,
    ).length;

    const totalPercent = enrollments.reduce((acc, e) => acc + (e.progress?.percent || 0), 0);
    const percent = totalCourses > 0 ? Math.round(totalPercent / totalCourses) : 0;

    // Total Hours Watched
    const progresses = await this.lessonProgressModel.find({ userId: uId }).lean();

    const totalWatchedSec = progresses.reduce((acc, p) => acc + (p.watchedSec || 0), 0);
    const hoursWatched = Math.round((totalWatchedSec / 3600) * 10) / 10;

    // 2. 7-Day Learning Time Chart (Past 7 calendar days)
    const learningTimeChart = this.build7DayChart(progresses);

    // 3. Practice Stats
    const currentStreak = user.streak?.current || 0;
    const longestStreak = user.streak?.longest || 0;

    const completedAttempts = await this.practiceAttemptModel
      .find({
        userId: uId,
      })
      .lean();

    const quizzesCompleted = completedAttempts.length;
    const totalScore = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const avgScorePercent = quizzesCompleted > 0 ? Math.round(totalScore / quizzesCompleted) : 0;
    const totalPoints = user.pointsBalance || 0;

    // 4. Achievements Summary
    const totalCount = await this.achievementModel.countDocuments({
      status: 'active',
    });
    const userAchievements = await this.userAchievementModel
      .find({ userId: uId })
      .sort({ unlockedAt: -1 })
      .lean();

    const unlockedCount = userAchievements.length;
    const latestUnlocked = userAchievements.slice(0, 3).map((u) => u.achievementKey);

    return {
      progressRing: {
        percent,
        completedCourses,
        totalCourses,
        hoursWatched,
      },
      learningTimeChart,
      practiceStats: {
        currentStreak,
        longestStreak,
        quizzesCompleted,
        avgScorePercent,
        totalPoints,
      },
      achievementsSummary: {
        totalCount,
        unlockedCount,
        latestUnlocked,
      },
    };
  }

  /**
   * Public profile endpoint (GET /users/:id) per API.md:107
   */
  async getPublicProfile(
    targetUserId: string,
    currentUserId?: string,
  ): Promise<PublicProfileResponseDto> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User profile not found',
      });
    }

    const uId = new Types.ObjectId(targetUserId);
    const user = await this.userModel.findById(uId).lean();
    if (!user || user.status === 'deleted') {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User profile not found or inactive',
      });
    }

    // Projects: if owner, return all; otherwise public only
    const projectFilter: Record<string, unknown> = {
      userId: uId,
      status: 'published',
    };
    if (currentUserId !== targetUserId) {
      projectFilter.visibility = 'public';
    }

    const projects = await this.projectModel.find(projectFilter).sort({ updatedAt: -1 }).lean();

    const achievements = await this.userAchievementModel
      .find({ userId: uId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .lean();

    const userObj = user as unknown as Record<string, unknown>;
    return {
      id: user._id.toString(),
      displayName: String(userObj.displayName || user.name || ''),
      headline: user.headline,
      bio: user.bio,
      photoUrl: (userObj.photoUrl as string | undefined) || user.avatarUrl,
      city: (userObj.city as string | undefined) || user.location,
      country: userObj.country as string | undefined,
      counters: {
        followers: user.counters?.followers || 0,
        following: user.counters?.following || 0,
        posts: user.counters?.posts || 0,
        projects: projects.length,
      },
      streak: user.streak
        ? {
            current: user.streak.current || 0,
            longest: user.streak.longest || 0,
          }
        : undefined,
      projects: projects.map((p) => ({
        id: p._id.toString(),
        userId: p.userId.toString(),
        title: p.title,
        summary: p.summary,
        status: p.status,
        coverUrl: p.coverUrl,
        files: p.files || [],
        links: p.links || [],
        tags: p.tags || [],
        visibility: p.visibility,
        createdAt: p.createdAt ? p.createdAt.toISOString() : undefined,
        updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
      })),
      achievements: achievements.map((a) => {
        const def = a.achievementId as unknown as {
          key?: string;
          title?: string;
          tier?: string;
          iconUrl?: string;
        };
        return {
          id: a._id ? a._id.toString() : '',
          key: a.achievementKey,
          title: def?.title || a.achievementKey,
          tier: def?.tier || 'bronze',
          iconUrl: def?.iconUrl,
          unlockedAt: a.unlockedAt ? new Date(a.unlockedAt).toISOString() : '',
        };
      }),
    };
  }

  private build7DayChart(
    progresses: Array<{
      watchedSec?: number;
      lastAccessedAt?: Date;
      updatedAt?: Date;
    }>,
  ) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const matches = progresses.filter((p) => {
        const accessed = p.lastAccessedAt || p.updatedAt;
        if (!accessed) return false;
        const time = new Date(accessed).getTime();
        return time >= dayStart.getTime() && time <= dayEnd.getTime();
      });

      const daySec = matches.reduce((acc, p) => acc + (p.watchedSec || 0), 0);
      const minutes = Math.round(daySec / 60);

      result.push({
        dateKey,
        dayLabel,
        minutes,
      });
    }

    return result;
  }
}
