import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Article,
  ArticleDocument,
  Author,
  AuthorDocument,
  Book,
  BookDocument,
  Course,
  CourseCategory,
  CourseCategoryDocument,
  CourseDocument,
  Lesson,
  LessonDocument,
  Topic,
  TopicDocument,
  Video,
  VideoDocument,
  Bookmark,
  BookmarkDocument,
  TopicFollow,
  TopicFollowDocument,
} from '../database/schemas';
import {
  ArticleQueryDto,
  BookQueryDto,
  CourseQueryDto,
  SearchQueryDto,
  VideoQueryDto,
} from '@sofe/shared';

export interface CursorPaginationResult<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    total: number;
  };
}

export function encodeCursor(doc: {
  _id: Types.ObjectId | string;
  createdAt?: Date | string;
}): string {
  const payload = JSON.stringify({
    id: doc._id.toString(),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  });
  return Buffer.from(payload).toString('base64');
}

export function decodeCursor(cursor?: string): { id: string; createdAt: Date } | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    if (parsed.id && parsed.createdAt) {
      return { id: parsed.id, createdAt: new Date(parsed.createdAt) };
    }
    if (Types.ObjectId.isValid(cursor)) {
      return { id: cursor, createdAt: new Date(0) };
    }
  } catch {
    if (Types.ObjectId.isValid(cursor)) {
      return { id: cursor, createdAt: new Date(0) };
    }
  }
  return null;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(CourseCategory.name)
    private readonly categoryModel: Model<CourseCategoryDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<ArticleDocument>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(TopicFollow.name)
    private readonly topicFollowModel: Model<TopicFollowDocument>,
  ) {}

  // ==========================================
  // COURSES & CATEGORIES
  // ==========================================

  async listCourses(
    query: CourseQueryDto,
  ): Promise<CursorPaginationResult<Record<string, unknown>>> {
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const filter: Record<string, unknown> = { status: 'published' };

    if (query.category) {
      if (Types.ObjectId.isValid(query.category)) {
        filter.categoryId = new Types.ObjectId(query.category);
      } else {
        const cat = await this.categoryModel.findOne({ slug: query.category }).exec();
        if (cat) {
          filter.categoryId = cat._id;
        } else {
          return { data: [], meta: { nextCursor: null, total: 0 } };
        }
      }
    }

    if (query.level) {
      filter.level = query.level;
    }

    if (query.price === 'free') {
      filter.$or = [{ 'pricing.isFree': true }, { 'pricing.priceInr': 0 }];
    } else if (query.price === 'paid') {
      filter['pricing.isFree'] = false;
      filter['pricing.priceInr'] = { $gt: 0 };
    }

    if (query.q && query.q.trim()) {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { subtitle: regex }, { tags: regex }];
    }

    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      filter.$or = [
        { createdAt: { $lt: decoded.createdAt } },
        {
          createdAt: decoded.createdAt,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.courseModel
        .find(filter)
        .populate('categoryId', 'name slug iconUrl')
        .populate('instructors', 'name title avatarUrl')
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .exec(),
      this.courseModel.countDocuments({ status: 'published' }).exec(),
    ]);

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && resultItems.length > 0 ? encodeCursor(resultItems[resultItems.length - 1]) : null;

    const mapped = resultItems.map((c) => ({
      ...c.toObject(),
      id: c._id.toString(),
    }));

    return {
      data: mapped,
      meta: {
        nextCursor,
        total,
      },
    };
  }

  async getCourseCategories(): Promise<Record<string, unknown>[]> {
    const categories = await this.categoryModel.find().sort({ order: 1, name: 1 }).exec();
    return categories.map((c) => ({
      ...c.toObject(),
      id: c._id.toString(),
    }));
  }

  async getCourseBySlug(slug: string): Promise<Record<string, unknown>> {
    const course = await this.courseModel
      .findOne({ slug, status: 'published' })
      .populate('categoryId', 'name slug iconUrl')
      .populate('instructors', 'name title bio avatarUrl links')
      .exec();

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found or is not published',
      });
    }

    // Populate curriculum outline safely (omitting sensitive video/reading internals)
    const modulesWithLessons = await Promise.all(
      (course.modules || []).map(async (mod) => {
        const lessons = await this.lessonModel
          .find({
            _id: { $in: mod.lessonIds },
            status: 'published',
          })
          .sort({ order: 1 })
          .select('title type durationSec order isFreePreview isRequired')
          .exec();

        return {
          id:
            (mod as unknown as { id?: string; _id?: Types.ObjectId }).id ||
            (mod as unknown as { id?: string; _id?: Types.ObjectId })._id?.toString() ||
            '',
          title: mod.title,
          order: mod.order,
          lessons: lessons.map((l) => ({
            id: l._id.toString(),
            title: l.title,
            type: l.type,
            durationSec: l.durationSec || 0,
            order: l.order,
            isFreePreview: l.isFreePreview,
            isRequired: l.isRequired,
          })),
        };
      }),
    );

    return {
      ...course.toObject(),
      id: course._id.toString(),
      modules: modulesWithLessons,
    };
  }

  // ==========================================
  // ARTICLES, TOPICS & AUTHORS (Startup World)
  // ==========================================

  async listArticles(
    query: ArticleQueryDto,
  ): Promise<CursorPaginationResult<Record<string, unknown>>> {
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const filter: Record<string, unknown> = { status: 'published' };

    if (query.topic) {
      if (Types.ObjectId.isValid(query.topic)) {
        const topId = new Types.ObjectId(query.topic);
        filter.$or = [{ primaryTopicId: topId }, { topicIds: topId }];
      } else {
        const top = await this.topicModel.findOne({ slug: query.topic }).exec();
        if (top) {
          filter.$or = [{ primaryTopicId: top._id }, { topicIds: top._id }];
        } else {
          return { data: [], meta: { nextCursor: null, total: 0 } };
        }
      }
    }

    if (query.q && query.q.trim()) {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
    }

    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      filter.$or = [
        { publishedAt: { $lt: decoded.createdAt } },
        {
          publishedAt: decoded.createdAt,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .populate('primaryTopicId', 'name slug')
        .populate('topicIds', 'name slug')
        .populate('authorId', 'name title avatarUrl')
        .sort({ publishedAt: -1, _id: -1 })
        .limit(limit + 1)
        .exec(),
      this.articleModel.countDocuments({ status: 'published' }).exec(),
    ]);

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && resultItems.length > 0
        ? encodeCursor({
            _id: resultItems[resultItems.length - 1]._id,
            createdAt:
              resultItems[resultItems.length - 1].publishedAt ||
              (resultItems[resultItems.length - 1] as unknown as { createdAt?: Date }).createdAt,
          })
        : null;

    const mapped = resultItems.map((a) => ({
      ...a.toObject(),
      id: a._id.toString(),
    }));

    return {
      data: mapped,
      meta: {
        nextCursor,
        total,
      },
    };
  }

  async getArticlesFeed(): Promise<{
    featured: Record<string, unknown>[];
    recent: Record<string, unknown>[];
    topics: Record<string, unknown>[];
  }> {
    const [featured, recent, topics] = await Promise.all([
      this.articleModel
        .find({ status: 'published', featured: true })
        .populate('primaryTopicId', 'name slug')
        .populate('authorId', 'name title avatarUrl')
        .sort({ publishedAt: -1 })
        .limit(5)
        .exec(),
      this.articleModel
        .find({ status: 'published' })
        .populate('primaryTopicId', 'name slug')
        .populate('authorId', 'name title avatarUrl')
        .sort({ publishedAt: -1 })
        .limit(20)
        .exec(),
      this.topicModel.find({ isTab: true }).sort({ order: 1, name: 1 }).exec(),
    ]);

    return {
      featured: featured.map((a) => ({ ...a.toObject(), id: a._id.toString() })),
      recent: recent.map((a) => ({ ...a.toObject(), id: a._id.toString() })),
      topics: topics.map((t) => ({ ...t.toObject(), id: t._id.toString() })),
    };
  }

  async getArticleBySlug(slug: string): Promise<Record<string, unknown>> {
    const article = await this.articleModel
      .findOne({ slug, status: 'published' })
      .populate('primaryTopicId', 'name slug description')
      .populate('topicIds', 'name slug')
      .populate('authorId', 'name title bio avatarUrl')
      .exec();

    if (!article) {
      throw new NotFoundException({
        code: 'ARTICLE_NOT_FOUND',
        message: 'Article not found or is not published',
      });
    }

    // Increment view count non-blocking
    this.articleModel.updateOne({ _id: article._id }, { $inc: { 'stats.views': 1 } }).exec();

    return {
      ...article.toObject(),
      id: article._id.toString(),
    };
  }

  async listTopics(isTabOnly: boolean = false): Promise<Record<string, unknown>[]> {
    const filter = isTabOnly ? { isTab: true } : {};
    const topics = await this.topicModel.find(filter).sort({ order: 1, name: 1 }).exec();
    return topics.map((t) => ({
      ...t.toObject(),
      id: t._id.toString(),
    }));
  }

  async getAuthorById(id: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Invalid author ID' });
    }

    const author = await this.authorModel.findById(id).exec();
    if (!author) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Author not found' });
    }

    const articles = await this.articleModel
      .find({ authorId: id, status: 'published' })
      .populate('primaryTopicId', 'name slug')
      .sort({ publishedAt: -1 })
      .limit(10)
      .exec();

    return {
      ...author.toObject(),
      id: author._id.toString(),
      articles: articles.map((a) => ({
        ...a.toObject(),
        id: a._id.toString(),
      })),
    };
  }

  // ==========================================
  // BOOKS & STANDALONE VIDEOS (Learn)
  // ==========================================

  async listBooks(query: BookQueryDto): Promise<CursorPaginationResult<Record<string, unknown>>> {
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const filter: Record<string, unknown> = { status: 'published' };

    if (query.category) {
      if (Types.ObjectId.isValid(query.category)) {
        filter.categoryId = new Types.ObjectId(query.category);
      } else {
        const cat = await this.categoryModel.findOne({ slug: query.category }).exec();
        if (cat) {
          filter.categoryId = cat._id;
        } else {
          return { data: [], meta: { nextCursor: null, total: 0 } };
        }
      }
    }

    if (query.format) {
      filter.format = query.format;
    }

    if (query.price === 'free') {
      filter.isFree = true;
    } else if (query.price === 'paid') {
      filter.isFree = false;
    }

    if (query.q && query.q.trim()) {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { author: regex }, { tags: regex }];
    }

    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      filter.$or = [
        { publishedAt: { $lt: decoded.createdAt } },
        {
          publishedAt: decoded.createdAt,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort({ publishedAt: -1, _id: -1 })
        .limit(limit + 1)
        .exec(),
      this.bookModel.countDocuments({ status: 'published' }).exec(),
    ]);

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && resultItems.length > 0
        ? encodeCursor({
            _id: resultItems[resultItems.length - 1]._id,
            createdAt:
              resultItems[resultItems.length - 1].publishedAt ||
              (resultItems[resultItems.length - 1] as unknown as { createdAt?: Date }).createdAt,
          })
        : null;

    const mapped = resultItems.map((b) => ({
      ...b.toObject(),
      id: b._id.toString(),
    }));

    return {
      data: mapped,
      meta: {
        nextCursor,
        total,
      },
    };
  }

  async getBookBySlug(slug: string): Promise<Record<string, unknown>> {
    const book = await this.bookModel
      .findOne({ slug, status: 'published' })
      .populate('categoryId', 'name slug')
      .exec();

    if (!book) {
      throw new NotFoundException({
        code: 'BOOK_NOT_FOUND',
        message: 'Book not found or is not published',
      });
    }

    return {
      ...book.toObject(),
      id: book._id.toString(),
    };
  }

  async listVideos(query: VideoQueryDto): Promise<CursorPaginationResult<Record<string, unknown>>> {
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const filter: Record<string, unknown> = { status: 'published' };

    if (query.topic) {
      if (Types.ObjectId.isValid(query.topic)) {
        filter.topicIds = { $in: [new Types.ObjectId(query.topic)] };
      } else {
        const top = await this.topicModel.findOne({ slug: query.topic }).exec();
        if (top) {
          filter.topicIds = { $in: [top._id] };
        } else {
          return { data: [], meta: { nextCursor: null, total: 0 } };
        }
      }
    }

    if (query.price === 'free') {
      filter.isFree = true;
    } else if (query.price === 'paid') {
      filter.isFree = false;
    }

    if (query.q && query.q.trim()) {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      filter.$or = [
        { publishedAt: { $lt: decoded.createdAt } },
        {
          publishedAt: decoded.createdAt,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.videoModel
        .find(filter)
        .populate('topicIds', 'name slug')
        .sort({ publishedAt: -1, _id: -1 })
        .limit(limit + 1)
        .exec(),
      this.videoModel.countDocuments({ status: 'published' }).exec(),
    ]);

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && resultItems.length > 0
        ? encodeCursor({
            _id: resultItems[resultItems.length - 1]._id,
            createdAt:
              resultItems[resultItems.length - 1].publishedAt ||
              (resultItems[resultItems.length - 1] as unknown as { createdAt?: Date }).createdAt,
          })
        : null;

    const mapped = resultItems.map((v) => ({
      ...v.toObject(),
      id: v._id.toString(),
    }));

    return {
      data: mapped,
      meta: {
        nextCursor,
        total,
      },
    };
  }

  async getVideoBySlug(slug: string): Promise<Record<string, unknown>> {
    const video = await this.videoModel
      .findOne({ slug, status: 'published' })
      .populate('topicIds', 'name slug')
      .exec();

    if (!video) {
      throw new NotFoundException({
        code: 'VIDEO_NOT_FOUND',
        message: 'Video not found or is not published',
      });
    }

    return {
      ...video.toObject(),
      id: video._id.toString(),
    };
  }

  // ==========================================
  // UNIFIED SEARCH
  // ==========================================

  async search(query: SearchQueryDto): Promise<{
    data: {
      courses?: Record<string, unknown>[];
      articles?: Record<string, unknown>[];
      books?: Record<string, unknown>[];
      videos?: Record<string, unknown>[];
    };
    meta: { total: number };
  }> {
    if (!query.q || !query.q.trim()) {
      throw new BadRequestException({
        code: 'QUERY_REQUIRED',
        message: 'Search query parameter (q) is required',
      });
    }

    const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const limit = Math.max(1, Math.min(20, Number(query.limit) || 10));

    const promises: {
      courses?: Promise<CourseDocument[]>;
      articles?: Promise<ArticleDocument[]>;
      books?: Promise<BookDocument[]>;
      videos?: Promise<VideoDocument[]>;
    } = {};

    const type = query.type;

    if (!type || type === 'course') {
      promises.courses = this.courseModel
        .find({
          status: 'published',
          $or: [{ title: regex }, { subtitle: regex }, { tags: regex }],
        })
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    }

    if (!type || type === 'article') {
      promises.articles = this.articleModel
        .find({
          status: 'published',
          $or: [{ title: regex }, { excerpt: regex }, { tags: regex }],
        })
        .populate('primaryTopicId', 'name slug')
        .populate('authorId', 'name avatarUrl')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .exec();
    }

    if (!type || type === 'book') {
      promises.books = this.bookModel
        .find({
          status: 'published',
          $or: [{ title: regex }, { author: regex }, { tags: regex }],
        })
        .populate('categoryId', 'name slug')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .exec();
    }

    if (!type || type === 'video') {
      promises.videos = this.videoModel
        .find({
          status: 'published',
          $or: [{ title: regex }, { description: regex }],
        })
        .populate('topicIds', 'name slug')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .exec();
    }

    const [courses, articles, books, videos] = await Promise.all([
      promises.courses || Promise.resolve([]),
      promises.articles || Promise.resolve([]),
      promises.books || Promise.resolve([]),
      promises.videos || Promise.resolve([]),
    ]);

    const mappedCourses = courses.map((c) => ({ ...c.toObject(), id: c._id.toString() }));
    const mappedArticles = articles.map((a) => ({ ...a.toObject(), id: a._id.toString() }));
    const mappedBooks = books.map((b) => ({ ...b.toObject(), id: b._id.toString() }));
    const mappedVideos = videos.map((v) => ({ ...v.toObject(), id: v._id.toString() }));

    const total =
      mappedCourses.length + mappedArticles.length + mappedBooks.length + mappedVideos.length;

    return {
      data: {
        courses: mappedCourses.length > 0 ? mappedCourses : undefined,
        articles: mappedArticles.length > 0 ? mappedArticles : undefined,
        books: mappedBooks.length > 0 ? mappedBooks : undefined,
        videos: mappedVideos.length > 0 ? mappedVideos : undefined,
      },
      meta: {
        total,
      },
    };
  }

  // ==========================================
  // BOOKMARKS & TOPIC FOLLOWS (T2.10)
  // ==========================================

  async listBookmarks(userId: string, targetType?: string): Promise<Record<string, unknown>[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (targetType) {
      query.targetType = targetType;
    }

    const bookmarks = await this.bookmarkModel.find(query).sort({ createdAt: -1 }).exec();

    // Populate targets (primarily articles)
    const enriched = await Promise.all(
      bookmarks.map(async (bm) => {
        const item: Record<string, unknown> = {
          id: bm._id.toString(),
          targetType: bm.targetType,
          targetId: bm.targetId.toString(),
          createdAt: (bm as unknown as { createdAt?: Date }).createdAt,
        };

        if (bm.targetType === 'article') {
          const article = await this.articleModel
            .findById(bm.targetId)
            .populate('primaryTopicId', 'name slug')
            .populate('authorId', 'name title avatarUrl')
            .exec();
          if (article) {
            item.target = { ...article.toObject(), id: article._id.toString() };
          }
        }
        return item;
      }),
    );

    return enriched;
  }

  async createBookmark(
    userId: string,
    targetType: string,
    targetId: string,
  ): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid user ID or target ID');
    }

    const uId = new Types.ObjectId(userId);
    const tId = new Types.ObjectId(targetId);

    const bookmark = await this.bookmarkModel.findOneAndUpdate(
      { userId: uId, targetType, targetId: tId },
      { $setOnInsert: { userId: uId, targetType, targetId: tId } },
      { upsert: true, new: true },
    );

    if (targetType === 'article') {
      await this.articleModel.updateOne({ _id: tId }, { $inc: { 'stats.bookmarks': 1 } }).exec();
    }

    return {
      id: bookmark._id.toString(),
      targetType: bookmark.targetType,
      targetId: bookmark.targetId.toString(),
    };
  }

  async deleteBookmark(
    userId: string,
    targetType: string,
    targetId: string,
  ): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid user ID or target ID');
    }

    const uId = new Types.ObjectId(userId);
    const tId = new Types.ObjectId(targetId);

    const result = await this.bookmarkModel
      .findOneAndDelete({ userId: uId, targetType, targetId: tId })
      .exec();

    if (result && targetType === 'article') {
      await this.articleModel
        .updateOne({ _id: tId, 'stats.bookmarks': { $gt: 0 } }, { $inc: { 'stats.bookmarks': -1 } })
        .exec();
    }

    return { success: !!result };
  }

  async followTopic(userId: string, topicId: string): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid user ID or topic ID');
    }

    const uId = new Types.ObjectId(userId);
    const topId = new Types.ObjectId(topicId);

    await this.topicFollowModel.findOneAndUpdate(
      { userId: uId, topicId: topId },
      { $setOnInsert: { userId: uId, topicId: topId } },
      { upsert: true },
    );

    return { success: true };
  }

  async unfollowTopic(userId: string, topicId: string): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid user ID or topic ID');
    }

    const uId = new Types.ObjectId(userId);
    const topId = new Types.ObjectId(topicId);

    await this.topicFollowModel.findOneAndDelete({ userId: uId, topicId: topId }).exec();

    return { success: true };
  }

  async getFollowedTopics(userId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    const follows = await this.topicFollowModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('topicId')
      .exec();

    return follows.map((f) => f.topicId.toString());
  }
}
