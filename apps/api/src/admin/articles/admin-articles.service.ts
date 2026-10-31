import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Article,
  ArticleDocument,
  ContentVersion,
  ContentVersionDocument,
} from '../../database/schemas';
import { CreateArticleDto, UpdateArticleDto, ARTICLE_STATUSES, ArticleStatus } from '@sofe/shared';

export interface ArticleFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  topicId?: string;
  authorId?: string;
  featured?: boolean | string;
  search?: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])?[^"'>]+(\1)?/gi, '')
    .replace(/javascript:[^"'>]+/gi, '')
    .trim();
}

export function calculateReadTime(html: string): number {
  if (!html) return 1;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

@Injectable()
export class AdminArticlesService {
  constructor(
    @InjectModel(Article.name)
    private readonly articleModel: Model<ArticleDocument>,
    @InjectModel(ContentVersion.name)
    private readonly contentVersionModel: Model<ContentVersionDocument>,
  ) {}

  // ==========================================
  // List Articles (CS13)
  // ==========================================

  async listArticles(query: ArticleFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.topicId && Types.ObjectId.isValid(query.topicId)) {
      const topicObjId = new Types.ObjectId(query.topicId);
      filter.$or = [{ primaryTopicId: topicObjId }, { topicIds: topicObjId }];
    }

    if (query.authorId && Types.ObjectId.isValid(query.authorId)) {
      filter.authorId = new Types.ObjectId(query.authorId);
    }

    if (query.featured !== undefined) {
      filter.featured = query.featured === true || query.featured === 'true';
    }

    if (query.search) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ title: searchRegex }, { slug: searchRegex }];
    }

    const [total, articles] = await Promise.all([
      this.articleModel.countDocuments(filter).exec(),
      this.articleModel
        .find(filter)
        .populate('primaryTopicId', 'name slug')
        .populate('authorId', 'name avatarUrl title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const items = articles.map((a) => ({
      ...a.toObject(),
      id: a._id.toString(),
    }));

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ==========================================
  // Get Article By ID
  // ==========================================

  async getArticleById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel
      .findById(id)
      .populate('primaryTopicId', 'name slug')
      .populate('topicIds', 'name slug')
      .populate('authorId', 'name avatarUrl title bio')
      .exec();

    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    return {
      ...article.toObject(),
      id: article._id.toString(),
    };
  }

  // ==========================================
  // Create Article (CS14)
  // ==========================================

  async createArticle(dto: CreateArticleDto, adminId?: string): Promise<ArticleDocument> {
    if (!dto.title?.trim()) {
      throw new BadRequestException({ code: 'TITLE_REQUIRED', message: 'Title is required' });
    }

    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    if (!slug) {
      throw new BadRequestException({ code: 'INVALID_SLUG', message: 'Valid slug is required' });
    }

    const conflict = await this.articleModel.findOne({ slug }).exec();
    if (conflict) {
      throw new ConflictException({
        code: 'ARTICLE_EXISTS',
        message: 'An article with this slug already exists',
      });
    }

    const bodyHtml = sanitizeHtml(dto.bodyHtml || '');
    const readTimeMin =
      dto.readTimeMin && dto.readTimeMin > 0 ? dto.readTimeMin : calculateReadTime(bodyHtml);

    const article = new this.articleModel({
      title: dto.title.trim(),
      slug,
      excerpt: dto.excerpt?.trim() || '',
      bodyHtml,
      bodyJson: dto.bodyJson,
      coverUrl: dto.coverUrl?.trim() || '',
      coverAlt: dto.coverAlt?.trim() || '',
      primaryTopicId:
        dto.primaryTopicId && Types.ObjectId.isValid(dto.primaryTopicId)
          ? new Types.ObjectId(dto.primaryTopicId)
          : undefined,
      topicIds: (dto.topicIds || [])
        .filter((t) => Types.ObjectId.isValid(t))
        .map((t) => new Types.ObjectId(t)),
      tags: dto.tags || [],
      authorId:
        dto.authorId && Types.ObjectId.isValid(dto.authorId)
          ? new Types.ObjectId(dto.authorId)
          : undefined,
      readTimeMin,
      status: (dto.status || ARTICLE_STATUSES.DRAFT) as ArticleStatus,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      featured: dto.featured ?? false,
      seo: dto.seo,
      stats: { views: 0, bookmarks: 0 },
      createdBy:
        adminId && Types.ObjectId.isValid(adminId) ? new Types.ObjectId(adminId) : undefined,
      version: 1,
    });

    return article.save();
  }

  // ==========================================
  // Update Article (CS14)
  // ==========================================

  async updateArticle(
    id: string,
    dto: UpdateArticleDto,
    _adminId?: string,
  ): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const conflict = await this.articleModel
        .findOne({ _id: { $ne: id }, slug: formattedSlug })
        .exec();
      if (conflict) {
        throw new ConflictException({
          code: 'ARTICLE_EXISTS',
          message: 'Another article with this slug already exists',
        });
      }
      article.slug = formattedSlug;
    }

    if (dto.title !== undefined) article.title = dto.title.trim();
    if (dto.excerpt !== undefined) article.excerpt = dto.excerpt.trim();

    if (dto.bodyHtml !== undefined) {
      article.bodyHtml = sanitizeHtml(dto.bodyHtml);
      if (dto.readTimeMin === undefined) {
        article.readTimeMin = calculateReadTime(article.bodyHtml);
      }
    }
    if (dto.bodyJson !== undefined) article.bodyJson = dto.bodyJson;
    if (dto.readTimeMin !== undefined) article.readTimeMin = dto.readTimeMin;

    if (dto.coverUrl !== undefined) article.coverUrl = dto.coverUrl.trim();
    if (dto.coverAlt !== undefined) article.coverAlt = dto.coverAlt.trim();

    if (dto.primaryTopicId !== undefined) {
      article.primaryTopicId = Types.ObjectId.isValid(dto.primaryTopicId)
        ? new Types.ObjectId(dto.primaryTopicId)
        : article.primaryTopicId;
    }

    if (dto.topicIds !== undefined) {
      article.topicIds = dto.topicIds
        .filter((t) => Types.ObjectId.isValid(t))
        .map((t) => new Types.ObjectId(t));
    }

    if (dto.tags !== undefined) article.tags = dto.tags;

    if (dto.authorId !== undefined) {
      article.authorId = Types.ObjectId.isValid(dto.authorId)
        ? new Types.ObjectId(dto.authorId)
        : article.authorId;
    }

    if (dto.featured !== undefined) article.featured = dto.featured;
    if (dto.seo !== undefined) article.seo = dto.seo;

    if (dto.status !== undefined) {
      article.status = dto.status as ArticleStatus;
    }

    if (dto.scheduledAt !== undefined) {
      article.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    }

    return article.save();
  }

  // ==========================================
  // Delete Article
  // ==========================================

  async deleteArticle(
    id: string,
    _adminId?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    await this.articleModel.findByIdAndDelete(id).exec();

    return {
      success: true,
      message: 'Article deleted successfully',
    };
  }

  // ==========================================
  // Publish Article
  // ==========================================

  async publishArticle(id: string, adminId?: string): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    if (!article.title || !article.slug) {
      throw new BadRequestException({
        code: 'PUBLISH_BLOCKED',
        message: 'Article title and slug are required to publish',
      });
    }

    if (!article.primaryTopicId) {
      throw new BadRequestException({
        code: 'PUBLISH_BLOCKED',
        message: 'Primary topic is required to publish',
      });
    }

    if (!article.authorId) {
      throw new BadRequestException({
        code: 'PUBLISH_BLOCKED',
        message: 'Author is required to publish',
      });
    }

    const newVersion = (article.version || 1) + 1;
    article.status = ARTICLE_STATUSES.PUBLISHED;
    article.publishedAt = new Date();
    article.version = newVersion;

    const savedArticle = await article.save();

    // Snapshot in contentVersions
    const versionRecord = new this.contentVersionModel({
      entityType: 'article',
      entityId: savedArticle._id,
      version: newVersion,
      snapshot: savedArticle.toObject(),
      byAdminId:
        adminId && Types.ObjectId.isValid(adminId) ? new Types.ObjectId(adminId) : undefined,
    });
    await versionRecord.save();

    return savedArticle;
  }

  // ==========================================
  // Unpublish Article
  // ==========================================

  async unpublishArticle(id: string): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    article.status = ARTICLE_STATUSES.DRAFT;
    return article.save();
  }

  // ==========================================
  // Schedule Article
  // ==========================================

  async scheduleArticle(id: string, scheduledAtStr: string): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    const scheduledDate = new Date(scheduledAtStr);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException({ code: 'INVALID_DATE', message: 'Invalid schedule date' });
    }

    article.status = ARTICLE_STATUSES.SCHEDULED;
    article.scheduledAt = scheduledDate;
    return article.save();
  }

  // ==========================================
  // Toggle Featured
  // ==========================================

  async toggleFeatured(id: string): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Invalid article ID' });
    }

    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }

    article.featured = !article.featured;
    return article.save();
  }

  // ==========================================
  // Bulk Actions
  // ==========================================

  async bulkAction(
    ids: string[],
    action: 'archive' | 'feature' | 'unfeature',
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = (ids || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) {
      return { success: true, modifiedCount: 0 };
    }

    let update: Record<string, unknown> = {};
    if (action === 'archive') {
      update = { $set: { status: ARTICLE_STATUSES.ARCHIVED } };
    } else if (action === 'feature') {
      update = { $set: { featured: true } };
    } else if (action === 'unfeature') {
      update = { $set: { featured: false } };
    }

    const res = await this.articleModel.updateMany({ _id: { $in: validIds } }, update).exec();

    return {
      success: true,
      modifiedCount: res.modifiedCount,
    };
  }
}
