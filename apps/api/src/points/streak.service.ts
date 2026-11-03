import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ERROR_CODES, type StreakStatusDto } from '@sofe/shared';
import { StreakDay, StreakDayDocument, User, UserDocument } from '../database/schemas';

/**
 * Returns YYYY-MM-DD for a given timezone (defaults to Asia/Kolkata or UTC)
 */
export function getDateKeyInTimezone(tz?: string): string {
  const fallback = 'Asia/Kolkata';
  const effectiveTz = tz && tz.trim() ? tz.trim() : fallback;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: effectiveTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: fallback,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }
}

/**
 * Given YYYY-MM-DD, returns the previous calendar day YYYY-MM-DD in UTC arithmetic
 */
export function getYesterdayDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export interface RecordActivityResult {
  current: number;
  longest: number;
  dateKey: string;
  isNewDay: boolean;
}

@Injectable()
export class StreakService {
  constructor(
    @InjectModel(StreakDay.name)
    private readonly streakDayModel: Model<StreakDayDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Records user learning/practice activity, updates streakDays collection and
   * calculates streak rollover (same day, consecutive day, or gap > 1 day reset).
   */
  async recordActivity(
    userId: string,
    dateKey?: string,
    tz?: string,
    completedTasksCount = 1,
    pointsEarned = 0,
  ): Promise<RecordActivityResult> {
    const uId = new Types.ObjectId(userId);
    const targetDateKey = dateKey || getDateKeyInTimezone(tz);

    const user = await this.userModel.findById(uId);
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    }

    // 1. Upsert streakDays entry for this user and dateKey
    await this.streakDayModel.findOneAndUpdate(
      { userId: uId, dateKey: targetDateKey },
      {
        $inc: {
          activityCount: 1,
          completedTasksCount,
          pointsEarned,
        },
        $setOnInsert: {
          userId: uId,
          dateKey: targetDateKey,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // 2. Calculate streak rollover
    const currentStreak = user.streak?.current || 0;
    const longestStreak = user.streak?.longest || 0;
    const lastActiveDateKey = user.streak?.lastActiveDateKey;

    let newCurrent = currentStreak;
    let newLongest = longestStreak;
    let isNewDay = false;

    if (lastActiveDateKey === targetDateKey) {
      // Already active today: keep current streak count
      isNewDay = false;
      newCurrent = currentStreak > 0 ? currentStreak : 1;
      newLongest = Math.max(longestStreak, newCurrent);
    } else if (lastActiveDateKey === getYesterdayDateKey(targetDateKey)) {
      // Active yesterday: consecutive day streak extension!
      isNewDay = true;
      newCurrent = currentStreak + 1;
      newLongest = Math.max(longestStreak, newCurrent);
    } else {
      // Gap > 1 day or first time ever: reset current to 1
      isNewDay = true;
      newCurrent = 1;
      newLongest = Math.max(longestStreak, 1);
    }

    // 3. Persist updated streak on user
    if (!user.streak) {
      user.streak = {
        current: newCurrent,
        longest: newLongest,
        lastActiveDateKey: targetDateKey,
      };
    } else {
      user.streak.current = newCurrent;
      user.streak.longest = newLongest;
      user.streak.lastActiveDateKey = targetDateKey;
    }

    await this.userModel.findByIdAndUpdate(uId, {
      $set: {
        'streak.current': newCurrent,
        'streak.longest': newLongest,
        'streak.lastActiveDateKey': targetDateKey,
      },
    });

    return {
      current: newCurrent,
      longest: newLongest,
      dateKey: targetDateKey,
      isNewDay,
    };
  }

  /**
   * Returns current streak status and last 14 days of activity
   */
  async getStreakStatus(userId: string, tz?: string): Promise<StreakStatusDto> {
    const uId = new Types.ObjectId(userId);
    const todayDateKey = getDateKeyInTimezone(tz);

    const user = await this.userModel.findById(uId);
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    }

    const current = user.streak?.current || 0;
    const longest = user.streak?.longest || 0;
    const lastActiveDateKey = user.streak?.lastActiveDateKey;
    const isActiveToday = lastActiveDateKey === todayDateKey;

    // Fetch up to 14 recent streakDays
    const recent = await this.streakDayModel
      .find({ userId: uId })
      .sort({ dateKey: -1 })
      .limit(14)
      .lean();

    return {
      current,
      longest,
      lastActiveDateKey,
      isActiveToday,
      todayDateKey,
      recentDays: recent.map((r) => ({
        dateKey: r.dateKey,
        activityCount: r.activityCount || 0,
        completedTasksCount: r.completedTasksCount || 0,
        pointsEarned: r.pointsEarned || 0,
      })),
    };
  }
}
