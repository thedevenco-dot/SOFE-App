import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  type CreateProjectDto,
  type UpdateProjectDto,
  type ProjectQueryDto,
} from '@sofe/shared';
import { Project, ProjectDocument } from '../database/schemas/project.schema';
import { User, UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid user ID',
      });
    }

    const created = await this.projectModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
    });

    if (created.status === 'published') {
      await this.userModel.updateOne({ _id: created.userId }, { $inc: { 'counters.projects': 1 } });
    }

    return this.formatProject(created.toObject());
  }

  async findById(id: string, currentUserId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const project = await this.projectModel.findById(id).lean();
    if (!project) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const isOwner = currentUserId && project.userId.toString() === currentUserId;

    if (project.status === 'draft' && !isOwner) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    if (project.visibility === 'private' && !isOwner) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Project is private',
      });
    }

    const user = await this.userModel.findById(project.userId).lean();
    return this.formatProject(project, user);
  }

  async list(query: ProjectQueryDto, currentUserId?: string) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.userId) {
      if (!Types.ObjectId.isValid(query.userId)) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          hasMore: false,
        };
      }

      filter.userId = new Types.ObjectId(query.userId);
      const isOwner = currentUserId && query.userId === currentUserId;

      if (!isOwner) {
        filter.status = 'published';
        filter.visibility = 'public';
      } else if (query.status) {
        filter.status = query.status;
      }
    } else {
      filter.status = 'published';
      filter.visibility = 'public';
    }

    const [items, total] = await Promise.all([
      this.projectModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      this.projectModel.countDocuments(filter),
    ]);

    // Fetch authors
    const userIds = Array.from(new Set(items.map((p) => p.userId.toString())));
    const users = await this.userModel
      .find({ _id: { $in: userIds.map((uid) => new Types.ObjectId(uid)) } })
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const formattedItems = items.map((p) =>
      this.formatProject(p, userMap.get(p.userId.toString())),
    );

    return {
      items: formattedItems,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    if (project.userId.toString() !== userId) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You can only edit your own projects',
      });
    }

    const oldStatus = project.status;
    const newStatus = dto.status || oldStatus;

    Object.assign(project, dto);
    await project.save();

    if (oldStatus !== 'published' && newStatus === 'published') {
      await this.userModel.updateOne({ _id: project.userId }, { $inc: { 'counters.projects': 1 } });
    } else if (oldStatus === 'published' && newStatus !== 'published') {
      await this.userModel.updateOne(
        { _id: project.userId },
        { $inc: { 'counters.projects': -1 } },
      );
    }

    return this.formatProject(project.toObject());
  }

  async delete(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Project not found',
      });
    }

    if (project.userId.toString() !== userId) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You can only delete your own projects',
      });
    }

    if (project.status === 'published') {
      await this.userModel.updateOne(
        { _id: project.userId },
        { $inc: { 'counters.projects': -1 } },
      );
    }

    await this.projectModel.deleteOne({ _id: id });
    return { success: true };
  }

  private formatProject(project: Record<string, unknown>, user?: Record<string, unknown>) {
    const id = project._id ? String(project._id) : String(project.id || '');
    const userId = project.userId ? String(project.userId) : '';
    return {
      id,
      userId,
      title: String(project.title || ''),
      summary: String(project.summary || ''),
      status: (project.status as 'draft' | 'published') || 'draft',
      coverUrl: project.coverUrl as string | undefined,
      files: (project.files as Array<{ name: string; url: string; size: number }>) || [],
      links: (project.links as string[]) || [],
      tags: (project.tags as string[]) || [],
      visibility: (project.visibility as 'public' | 'followers' | 'private') || 'public',
      createdAt: project.createdAt
        ? new Date(project.createdAt as string | number | Date).toISOString()
        : undefined,
      updatedAt: project.updatedAt
        ? new Date(project.updatedAt as string | number | Date).toISOString()
        : undefined,
      author: user
        ? {
            id: user._id ? String(user._id) : '',
            name: String(user.name || ''),
            avatarUrl: user.avatarUrl as string | undefined,
            headline: user.headline as string | undefined,
            username: user.username as string | undefined,
          }
        : undefined,
    };
  }
}
