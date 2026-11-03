import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ERROR_CODES,
  QUIZ_KINDS,
  QUIZ_STATUSES,
  PRACTICE_SLOT_KEYS,
  PRACTICE_REF_TYPES,
  type PracticeSlotDto,
  type CopyWeekScheduleDto,
} from '@sofe/shared';
import {
  GlobalPracticeSchedule,
  GlobalPracticeScheduleDocument,
  Quiz,
  QuizDocument,
  ReflectionPrompt,
  ReflectionPromptDocument,
} from '../../database/schemas';

@Injectable()
export class AdminPracticeScheduleService {
  constructor(
    @InjectModel(GlobalPracticeSchedule.name)
    private readonly scheduleModel: Model<GlobalPracticeScheduleDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(ReflectionPrompt.name)
    private readonly promptModel: Model<ReflectionPromptDocument>,
  ) {}

  private getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(`${start}T00:00:00Z`);
    const last = new Date(`${end}T00:00:00Z`);

    while (current <= last) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }

  async getSchedule(from?: string, to?: string) {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const startDate = from || todayKey;

    const futureDate = new Date(now);
    futureDate.setUTCDate(futureDate.getUTCDate() + 14);
    const endDate = to || futureDate.toISOString().slice(0, 10);

    const schedules = await this.scheduleModel
      .find({
        dateKey: { $gte: startDate, $lte: endDate },
      })
      .sort({ dateKey: 1 })
      .lean();

    const existingKeys = new Set(schedules.map((s) => s.dateKey));

    // Calculate unassigned dates in next 7 days
    const next7Days: string[] = [];
    const checkDate = new Date(now);
    for (let i = 0; i < 7; i++) {
      const key = checkDate.toISOString().slice(0, 10);
      next7Days.push(key);
      checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    }

    const unassignedFutureDates = next7Days.filter((k) => !existingKeys.has(k));

    return {
      schedules: schedules.map((s) => ({
        id: s._id.toString(),
        dateKey: s.dateKey,
        slots: s.slots,
      })),
      unassignedFutureDates,
    };
  }

  async setScheduleForDate(dateKey: string, slots: PracticeSlotDto[]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid dateKey format (expected YYYY-MM-DD)',
      });
    }

    const schedule = await this.scheduleModel.findOneAndUpdate(
      { dateKey },
      {
        $set: {
          dateKey,
          slots: slots.map((s) => ({
            slotKey: s.slotKey,
            title: s.title,
            refType: s.refType,
            refId: s.refId,
            done: false,
            score: undefined,
          })),
        },
      },
      { upsert: true, new: true },
    );

    return {
      id: schedule._id.toString(),
      dateKey: schedule.dateKey,
      slots: schedule.slots,
    };
  }

  async copyWeek(dto: CopyWeekScheduleDto) {
    const sourceDates = this.getDatesInRange(
      dto.sourceFromDateKey,
      new Date(new Date(`${dto.sourceFromDateKey}T00:00:00Z`).getTime() + 6 * 86400000)
        .toISOString()
        .slice(0, 10),
    );

    const targetDates = this.getDatesInRange(
      dto.targetFromDateKey,
      new Date(new Date(`${dto.targetFromDateKey}T00:00:00Z`).getTime() + 6 * 86400000)
        .toISOString()
        .slice(0, 10),
    );

    const sourceSchedules = await this.scheduleModel.find({ dateKey: { $in: sourceDates } }).lean();

    const sourceMap = new Map(sourceSchedules.map((s) => [s.dateKey, s.slots]));
    const ops = [];

    for (let i = 0; i < 7; i++) {
      const sKey = sourceDates[i];
      const tKey = targetDates[i];
      const slots = sourceMap.get(sKey);

      if (slots && slots.length > 0) {
        ops.push(
          this.scheduleModel.findOneAndUpdate(
            { dateKey: tKey },
            { $set: { dateKey: tKey, slots } },
            { upsert: true, new: true },
          ),
        );
      }
    }

    await Promise.all(ops);
    return { success: true, copiedDays: ops.length };
  }

  async autoFill(from: string, to: string) {
    const dates = this.getDatesInRange(from, to);
    const existing = await this.scheduleModel.find({ dateKey: { $in: dates } }).lean();
    const existingKeys = new Set(existing.map((s) => s.dateKey));
    const missingDates = dates.filter((d) => !existingKeys.has(d));

    if (missingDates.length === 0) {
      return { success: true, filledDates: 0 };
    }

    const [quizzes, prompts] = await Promise.all([
      this.quizModel
        .find({ kind: QUIZ_KINDS.QUICK_QUIZ, status: QUIZ_STATUSES.PUBLISHED })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      this.promptModel.find({ active: true }).sort({ order: 1 }).limit(20).lean(),
    ]);

    const ops = missingDates.map((dateKey, index) => {
      const assignedQuiz = quizzes[index % (quizzes.length || 1)];
      const assignedPrompt = prompts[index % (prompts.length || 1)];

      const slots: PracticeSlotDto[] = [
        {
          slotKey: PRACTICE_SLOT_KEYS.QUICK_QUIZ,
          title: assignedQuiz?.title || 'Daily Rapid Calibration',
          refType: PRACTICE_REF_TYPES.QUIZ,
          refId: assignedQuiz?._id?.toString(),
          done: false,
        },
        {
          slotKey: PRACTICE_SLOT_KEYS.BRAIN_GAME,
          title: 'Cognitive Agility Sprint',
          refType: PRACTICE_REF_TYPES.GAME,
          done: false,
        },
        {
          slotKey: PRACTICE_SLOT_KEYS.SCENARIO_CHALLENGE,
          title: 'Tactical Negotiation Drill',
          refType: PRACTICE_REF_TYPES.CHALLENGE,
          done: false,
        },
        {
          slotKey: PRACTICE_SLOT_KEYS.MATCH_CONCEPT,
          title: 'Mental Models Alignment',
          refType: PRACTICE_REF_TYPES.GAME,
          done: false,
        },
        {
          slotKey: PRACTICE_SLOT_KEYS.DAILY_REFLECTION,
          title: assignedPrompt?.prompt || 'Executive Synthesis Note',
          refType: PRACTICE_REF_TYPES.PROMPT,
          refId: assignedPrompt?._id?.toString(),
          done: false,
        },
      ];

      return this.scheduleModel.findOneAndUpdate(
        { dateKey },
        { $set: { dateKey, slots } },
        { upsert: true, new: true },
      );
    });

    await Promise.all(ops);
    return { success: true, filledDates: ops.length };
  }
}
