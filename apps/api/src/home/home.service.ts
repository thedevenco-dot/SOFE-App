import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  CreateVisionBoardItemDto,
  UpdateVisionBoardItemDto,
  HomeDashboardResponse,
} from '@sofe/shared';
import {
  VisionBoardItem,
  VisionBoardItemDocument,
  DailyPlan,
  DailyPlanDocument,
  DailyPlanItemEntry,
  Quote,
  QuoteDocument,
  Word,
  WordDocument,
  Article,
  ArticleDocument,
  User,
  UserDocument,
} from '../database/schemas';
import { LearningService } from '../learning/learning.service';

export function getDateKeyInTimezone(tz?: string): { dateKey: string; hour: number } {
  try {
    const timeZone = tz || 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    return { dateKey: `${year}-${month}-${day}`, hour };
  } catch {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    return { dateKey, hour: now.getUTCHours() };
  }
}

export function getGreetingForHour(hour: number, name?: string): string {
  const displayName = name ? `, ${name}` : '';
  if (hour >= 5 && hour < 12) {
    return `Good morning${displayName}.`;
  }
  if (hour >= 12 && hour < 17) {
    return `Good afternoon${displayName}.`;
  }
  return `Good evening${displayName}.`;
}

@Injectable()
export class HomeService {
  constructor(
    @InjectModel(VisionBoardItem.name)
    private readonly visionBoardItemModel: Model<VisionBoardItemDocument>,
    @InjectModel(DailyPlan.name)
    private readonly dailyPlanModel: Model<DailyPlanDocument>,
    @InjectModel(Quote.name)
    private readonly quoteModel: Model<QuoteDocument>,
    @InjectModel(Word.name)
    private readonly wordModel: Model<WordDocument>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<ArticleDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly learningService: LearningService,
  ) {}

  // ==========================================
  // Daily Quote & Word Rotation
  // ==========================================

  async getDailyQuote(dateKey: string) {
    const quotes = await this.quoteModel.find({ status: 'published' }).sort({ _id: 1 });
    if (quotes.length === 0) {
      return {
        id: 'q-default',
        text: 'The non-obvious insight is the only true competitive moat.',
        author: 'Naveen Jain',
      };
    }
    const hash = dateKey.split('-').reduce((acc, part) => acc * 31 + parseInt(part, 10), 0);
    const chosen = quotes[Math.abs(hash) % quotes.length];
    return {
      id: chosen._id.toString(),
      text: chosen.text,
      author: chosen.author,
    };
  }

  async getDailyWord(dateKey: string) {
    const words = await this.wordModel.find({ status: 'published' }).sort({ _id: 1 });
    if (words.length === 0) {
      return {
        id: 'w-default',
        word: 'ASYMMETRY',
        meaning: 'A competitive advantage where small input produces exponential output.',
      };
    }
    const hash = dateKey.split('-').reduce((acc, part) => acc * 37 + parseInt(part, 10), 0);
    const chosen = words[Math.abs(hash) % words.length];
    return {
      id: chosen._id.toString(),
      word: chosen.word,
      meaning: chosen.meaning,
    };
  }

  async listQuotes() {
    const quotes = await this.quoteModel.find({ status: 'published' }).sort({ _id: -1 }).limit(50);
    return quotes.map((q) => ({
      id: q._id.toString(),
      text: q.text,
      author: q.author,
      tags: q.tags,
    }));
  }

  async listWords() {
    const words = await this.wordModel.find({ status: 'published' }).sort({ word: 1 }).limit(50);
    return words.map((w) => ({
      id: w._id.toString(),
      word: w.word,
      meaning: w.meaning,
    }));
  }

  // ==========================================
  // Daily Plan Management (Lazy Builder)
  // ==========================================

  async getOrCreateDailyPlan(userId: string, dateKey: string) {
    const uId = new Types.ObjectId(userId);
    let plan = await this.dailyPlanModel.findOne({ userId: uId, dateKey });

    if (!plan) {
      // Lazy builder: assemble personalized default daily items
      const continueData = this.learningService?.getContinueLesson
        ? await Promise.resolve(this.learningService.getContinueLesson(userId)).catch(() => null)
        : null;
      const spotlight = await Promise.resolve(
        this.articleModel?.findOne({ status: 'published', featured: true }),
      ).catch(() => null);

      const defaultItems: DailyPlanItemEntry[] = [
        {
          id: new Types.ObjectId().toHexString(),
          key: 'watch_lesson',
          label: continueData?.lesson
            ? `Continue Lesson: ${continueData.lesson.title}`
            : 'Explore Foundations of Venture Building',
          done: false,
          refId: continueData?.lesson?.id || continueData?.lesson?._id?.toString(),
        },
        {
          id: new Types.ObjectId().toHexString(),
          key: 'reflect',
          label: 'Daily Founder Reflection',
          done: false,
        },
        {
          id: new Types.ObjectId().toHexString(),
          key: 'complete_quiz',
          label: 'Daily Decision Scenario: Rapid Calibration',
          done: false,
        },
        {
          id: new Types.ObjectId().toHexString(),
          key: 'read_article',
          label: spotlight ? `Read: ${spotlight.title}` : 'Review Weekly Tactical Briefing',
          done: false,
          refId: spotlight?._id?.toString(),
        },
      ];

      plan = await this.dailyPlanModel.findOneAndUpdate(
        { userId: uId, dateKey },
        {
          $setOnInsert: {
            userId: uId,
            dateKey,
            items: defaultItems,
            completedCount: 0,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (!plan) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Failed to initialize daily plan',
      });
    }

    return {
      id: plan._id.toString(),
      userId: plan.userId.toString(),
      dateKey: plan.dateKey,
      items: plan.items.map((i) => ({
        id: i.id,
        key: i.key,
        label: i.label,
        done: i.done,
        doneAt: i.doneAt ? i.doneAt.toISOString() : undefined,
        refId: i.refId,
      })),
      completedCount: plan.completedCount,
    };
  }

  async toggleTaskCompletion(userId: string, taskId: string, done: boolean, dateKey?: string) {
    const uId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = {
      userId: uId,
      'items.id': taskId,
    };
    if (dateKey) {
      query.dateKey = dateKey;
    }

    const plan = await this.dailyPlanModel.findOne(query);
    if (!plan) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Daily plan task not found',
      });
    }

    const targetItem = plan.items.find((i) => i.id === taskId);
    if (!targetItem) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Daily plan task item not found',
      });
    }

    targetItem.done = done;
    targetItem.doneAt = done ? new Date() : undefined;
    plan.completedCount = plan.items.filter((i) => i.done).length;
    await plan.save();

    return {
      id: plan._id.toString(),
      userId: plan.userId.toString(),
      dateKey: plan.dateKey,
      items: plan.items.map((i) => ({
        id: i.id,
        key: i.key,
        label: i.label,
        done: i.done,
        doneAt: i.doneAt ? i.doneAt.toISOString() : undefined,
        refId: i.refId,
      })),
      completedCount: plan.completedCount,
    };
  }

  // ==========================================
  // Vision Board CRUD
  // ==========================================

  async getVisionBoardItems(userId: string) {
    const uId = new Types.ObjectId(userId);
    const items = await this.visionBoardItemModel.find({ userId: uId }).sort({ order: 1 });
    return items.map((item) => ({
      id: item._id.toString(),
      userId: item.userId.toString(),
      imageUrl: item.imageUrl,
      caption: item.caption,
      order: item.order,
      createdAt: (item as unknown as { createdAt?: Date }).createdAt?.toISOString(),
      updatedAt: (item as unknown as { updatedAt?: Date }).updatedAt?.toISOString(),
    }));
  }

  async createVisionBoardItem(userId: string, dto: CreateVisionBoardItemDto) {
    const uId = new Types.ObjectId(userId);
    const currentCount = await this.visionBoardItemModel.countDocuments({ userId: uId });

    if (currentCount >= 12) {
      throw new BadRequestException({
        code: 'VISION_BOARD_LIMIT_REACHED',
        message: 'Vision board is limited to a maximum of 12 items',
      });
    }

    const order = dto.order !== undefined ? dto.order : currentCount;
    const doc = new this.visionBoardItemModel({
      userId: uId,
      imageUrl: dto.imageUrl,
      caption: dto.caption || '',
      order,
    });
    await doc.save();

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      imageUrl: doc.imageUrl,
      caption: doc.caption,
      order: doc.order,
      createdAt: (doc as unknown as { createdAt?: Date }).createdAt?.toISOString(),
      updatedAt: (doc as unknown as { updatedAt?: Date }).updatedAt?.toISOString(),
    };
  }

  async updateVisionBoardItem(userId: string, id: string, dto: UpdateVisionBoardItemDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vision board item not found',
      });
    }
    const uId = new Types.ObjectId(userId);
    const item = await this.visionBoardItemModel.findOne({
      _id: new Types.ObjectId(id),
      userId: uId,
    });
    if (!item) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vision board item not found',
      });
    }

    if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;
    if (dto.caption !== undefined) item.caption = dto.caption;
    if (dto.order !== undefined) item.order = dto.order;
    await item.save();

    return {
      id: item._id.toString(),
      userId: item.userId.toString(),
      imageUrl: item.imageUrl,
      caption: item.caption,
      order: item.order,
      createdAt: (item as unknown as { createdAt?: Date }).createdAt?.toISOString(),
      updatedAt: (item as unknown as { updatedAt?: Date }).updatedAt?.toISOString(),
    };
  }

  async reorderVisionBoardItems(userId: string, itemIds: string[]) {
    const uId = new Types.ObjectId(userId);
    const ops = itemIds.map((itemId, index) => {
      if (!Types.ObjectId.isValid(itemId)) return null;
      return this.visionBoardItemModel.updateOne(
        { _id: new Types.ObjectId(itemId), userId: uId },
        { $set: { order: index } },
      );
    });

    await Promise.all(ops.filter(Boolean));
    return this.getVisionBoardItems(userId);
  }

  async deleteVisionBoardItem(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vision board item not found',
      });
    }
    const uId = new Types.ObjectId(userId);
    const res = await this.visionBoardItemModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: uId,
    });
    if (res.deletedCount === 0) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vision board item not found',
      });
    }
    return { success: true };
  }

  // ==========================================
  // Home Dashboard Aggregator (HM1)
  // ==========================================

  async getHomeDashboard(userId: string, tz?: string): Promise<HomeDashboardResponse> {
    const { dateKey, hour } = getDateKeyInTimezone(tz);

    const user = await this.userModel.findById(userId);
    const name = user?.name || (user as unknown as { fullName?: string })?.fullName || 'Founder';
    const greeting = getGreetingForHour(hour, name);

    const [quote, word, visionBoard, todayPlan, continueData, spotlight] = await Promise.all([
      this.getDailyQuote(dateKey),
      this.getDailyWord(dateKey),
      this.getVisionBoardItems(userId),
      this.getOrCreateDailyPlan(userId, dateKey),
      this.learningService?.getContinueLesson
        ? Promise.resolve(this.learningService.getContinueLesson(userId)).catch(() => null)
        : Promise.resolve(null),
      Promise.resolve(
        this.articleModel
          ?.findOne({ status: 'published', featured: true })
          ?.populate('primaryTopicId', 'name slug')
          ?.sort({ publishedAt: -1 }),
      ).catch(() => null),
    ]);

    let continueLearning = null;
    if (continueData?.lesson) {
      const lessonObj = continueData.lesson as unknown as Record<string, unknown>;
      continueLearning = {
        courseId: continueData.courseId.toString(),
        courseTitle: 'Foundations of High-Growth Venture Building',
        lessonId: (lessonObj['id'] as string) || continueData.lesson._id?.toString(),
        lessonTitle: continueData.lesson.title,
        moduleTitle: (lessonObj['moduleTitle'] as string) || 'Module 1: Problem-Solution Fit',
        percent: continueData.progress?.percent || 0,
        durationSec: continueData.lesson.durationSec,
        thumbnailUrl: lessonObj['thumbnailUrl'] as string | undefined,
      };
    }

    let spotlightArticle = null;
    if (spotlight) {
      const topic = spotlight.primaryTopicId as unknown as { name?: string };
      spotlightArticle = {
        id: spotlight._id.toString(),
        slug: spotlight.slug,
        title: spotlight.title,
        excerpt: spotlight.excerpt,
        coverUrl: spotlight.coverUrl,
        readTimeMin: spotlight.readTimeMin,
        topicName: topic?.name || 'Venture Strategy',
      };
    }

    return {
      greeting,
      user: {
        id: userId,
        name,
        avatarUrl: user?.avatarUrl,
        cohortLabel: 'COHORT IX · WEEK 4',
      },
      streak: {
        currentStreakDays: 26,
        points: 1420,
      },
      quote,
      word,
      visionBoard,
      todayPlan,
      continueLearning,
      spotlightArticle,
    };
  }
}
