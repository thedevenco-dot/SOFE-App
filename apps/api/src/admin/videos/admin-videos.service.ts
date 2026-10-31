import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from '../../database/schemas/video.schema';
import { CreateVideoDto, UpdateVideoDto, MuxAssetStatus } from '@sofe/shared';

export interface VideoFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  topicId?: string;
  isFree?: boolean | string;
  search?: string;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

@Injectable()
export class AdminVideosService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
  ) {}

  // ==========================================
  // List Standalone Videos (CS12)
  // ==========================================

  async listVideos(query: VideoFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.topicId && Types.ObjectId.isValid(query.topicId)) {
      filter.topicIds = { $in: [new Types.ObjectId(query.topicId)] };
    }

    if (query.isFree !== undefined && query.isFree !== 'all') {
      filter.isFree = query.isFree === true || query.isFree === 'true';
    }

    if (query.search && query.search.trim()) {
      const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { slug: regex }];
    }

    const [items, total] = await Promise.all([
      this.videoModel
        .find(filter)
        .populate('topicIds', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.videoModel.countDocuments(filter).exec(),
    ]);

    const mapped = items.map((v) => ({
      ...v.toObject(),
      id: v._id.toString(),
    }));

    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ==========================================
  // Get Video by ID
  // ==========================================

  async getVideoById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Invalid video ID' });
    }

    const video = await this.videoModel.findById(id).populate('topicIds', 'name slug').exec();

    if (!video) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Video not found' });
    }

    return {
      ...video.toObject(),
      id: video._id.toString(),
    };
  }

  // ==========================================
  // Create Video (CS12)
  // ==========================================

  async createVideo(dto: CreateVideoDto, _adminId?: string): Promise<VideoDocument> {
    if (!dto.title?.trim()) {
      throw new BadRequestException({ code: 'TITLE_REQUIRED', message: 'Video title is required' });
    }

    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    if (!slug) {
      throw new BadRequestException({ code: 'INVALID_SLUG', message: 'Valid slug is required' });
    }

    const conflict = await this.videoModel.findOne({ slug }).exec();
    if (conflict) {
      throw new ConflictException({
        code: 'VIDEO_EXISTS',
        message: 'A video with this slug already exists',
      });
    }

    const status = dto.status || 'draft';
    const publishedAt =
      status === 'published'
        ? dto.publishedAt
          ? new Date(dto.publishedAt)
          : new Date()
        : dto.publishedAt
          ? new Date(dto.publishedAt)
          : undefined;

    const topicIds = (dto.topicIds || [])
      .filter((t) => Types.ObjectId.isValid(t))
      .map((t) => new Types.ObjectId(t));

    const video = new this.videoModel({
      title: dto.title.trim(),
      slug,
      description: dto.description?.trim() || '',
      thumbnailUrl: dto.thumbnailUrl?.trim() || '',
      mux: dto.mux || {},
      durationSec: dto.durationSec !== undefined ? Math.max(0, dto.durationSec) : 0,
      topicIds,
      isFree: dto.isFree ?? true,
      status,
      publishedAt,
    });

    return video.save();
  }

  // ==========================================
  // Update Video (CS12)
  // ==========================================

  async updateVideo(id: string, dto: UpdateVideoDto, _adminId?: string): Promise<VideoDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Invalid video ID' });
    }

    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Video not found' });
    }

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const conflict = await this.videoModel
        .findOne({ slug: formattedSlug, _id: { $ne: video._id } })
        .exec();
      if (conflict) {
        throw new ConflictException({
          code: 'VIDEO_EXISTS',
          message: 'Another video with this slug already exists',
        });
      }
      video.slug = formattedSlug;
    }

    if (dto.title !== undefined) video.title = dto.title.trim();
    if (dto.description !== undefined) video.description = dto.description.trim();
    if (dto.thumbnailUrl !== undefined) video.thumbnailUrl = dto.thumbnailUrl.trim();

    if (dto.mux !== undefined) {
      video.mux = {
        ...video.mux,
        ...dto.mux,
        status: (dto.mux.status || video.mux?.status) as MuxAssetStatus,
      };
    }

    if (dto.durationSec !== undefined) {
      video.durationSec = Math.max(0, dto.durationSec);
    }

    if (dto.topicIds !== undefined) {
      video.topicIds = dto.topicIds
        .filter((t) => Types.ObjectId.isValid(t))
        .map((t) => new Types.ObjectId(t));
    }

    if (dto.isFree !== undefined) video.isFree = dto.isFree;

    if (dto.status !== undefined) {
      if (dto.status === 'published' && video.status !== 'published' && !video.publishedAt) {
        video.publishedAt = new Date();
      }
      video.status = dto.status;
    }

    if (dto.publishedAt !== undefined) {
      video.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : undefined;
    }

    return video.save();
  }

  // ==========================================
  // Delete Video
  // ==========================================

  async deleteVideo(id: string, _adminId?: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Invalid video ID' });
    }

    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Video not found' });
    }

    await this.videoModel.findByIdAndDelete(id).exec();
    return { success: true, message: 'Video deleted successfully' };
  }

  // ==========================================
  // Publish / Unpublish
  // ==========================================

  async publishVideo(id: string, _adminId?: string): Promise<VideoDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Invalid video ID' });
    }

    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Video not found' });
    }

    video.status = 'published';
    if (!video.publishedAt) {
      video.publishedAt = new Date();
    }
    return video.save();
  }

  async unpublishVideo(id: string, _adminId?: string): Promise<VideoDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Invalid video ID' });
    }

    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException({ code: 'VIDEO_NOT_FOUND', message: 'Video not found' });
    }

    video.status = 'draft';
    return video.save();
  }

  // ==========================================
  // Bulk Actions
  // ==========================================

  async bulkAction(
    ids: string[],
    action: 'archive' | 'delete',
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = (ids || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) {
      return { success: true, modifiedCount: 0 };
    }

    if (action === 'delete') {
      const res = await this.videoModel.deleteMany({ _id: { $in: validIds } }).exec();
      return { success: true, modifiedCount: res.deletedCount || 0 };
    }

    const res = await this.videoModel
      .updateMany({ _id: { $in: validIds } }, { $set: { status: 'archived' } })
      .exec();

    return { success: true, modifiedCount: res.modifiedCount || 0 };
  }
}
