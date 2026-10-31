import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Course,
  CourseDocument,
  Lesson,
  LessonDocument,
  LessonResourceItem,
} from '../../database/schemas';
import {
  CreateLessonDto,
  UpdateLessonDto,
  MUX_ASSET_STATUSES,
  LessonType,
  LessonStatus,
  MuxAssetStatus,
} from '@sofe/shared';

export interface LessonFilterQuery {
  page?: number;
  limit?: number;
  courseId?: string;
  moduleId?: string;
  type?: string;
  status?: string;
  search?: string;
}

export interface VideoAssetsQuery {
  page?: number;
  limit?: number;
  courseId?: string;
  status?: string;
  search?: string;
}

export interface VideoAssetItem {
  id: string;
  sourceType: 'lesson' | 'standalone';
  title: string;
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  assetId?: string;
  playbackId?: string;
  status: string;
  durationSec: number;
  isFreePreview?: boolean;
  updatedAt: string;
  error?: string;
}

@Injectable()
export class AdminLessonsService {
  constructor(
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
  ) {}

  // ==========================================
  // List Lessons
  // ==========================================

  async listLessons(query: LessonFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.courseId && Types.ObjectId.isValid(query.courseId)) {
      filter.courseId = new Types.ObjectId(query.courseId);
    }
    if (query.moduleId && Types.ObjectId.isValid(query.moduleId)) {
      filter.moduleId = new Types.ObjectId(query.moduleId);
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const [total, lessons] = await Promise.all([
      this.lessonModel.countDocuments(filter).exec(),
      this.lessonModel
        .find(filter)
        .sort({ courseId: 1, moduleId: 1, order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    // Populate course titles for convenience
    const courseIds = [...new Set(lessons.map((l) => l.courseId.toString()))];
    const courses = await this.courseModel
      .find({ _id: { $in: courseIds } })
      .select('title modules')
      .lean()
      .exec();

    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const items = lessons.map((l) => {
      const course = courseMap.get(l.courseId.toString());
      const moduleObj = course?.modules?.find(
        (m: { _id?: Types.ObjectId; id?: string }) =>
          (m._id || m.id)?.toString() === l.moduleId.toString(),
      );

      return {
        ...l.toObject(),
        id: l._id.toString(),
        courseTitle: course?.title || 'Unknown Course',
        moduleTitle: moduleObj?.title || 'Unknown Module',
      };
    });

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
  // Get Lesson By ID
  // ==========================================

  async getLessonById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Invalid lesson ID' });
    }

    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Lesson not found' });
    }

    const course = await this.courseModel
      .findById(lesson.courseId)
      .select('title slug modules')
      .lean()
      .exec();

    const moduleObj = course?.modules?.find(
      (m) =>
        (m as unknown as { _id?: Types.ObjectId; id?: string })._id?.toString() ===
          lesson.moduleId.toString() ||
        (m as unknown as { _id?: Types.ObjectId; id?: string }).id === lesson.moduleId.toString(),
    );

    return {
      ...lesson.toObject(),
      id: lesson._id.toString(),
      course: course
        ? {
            id: course._id.toString(),
            title: course.title,
            slug: course.slug,
          }
        : null,
      module: moduleObj
        ? {
            id: (
              (moduleObj as unknown as { _id?: Types.ObjectId; id?: string })._id ||
              (moduleObj as unknown as { _id?: Types.ObjectId; id?: string }).id
            )?.toString(),
            title: moduleObj.title,
          }
        : null,
    };
  }

  // ==========================================
  // Create Lesson
  // ==========================================

  async createLesson(dto: CreateLessonDto, adminId?: string): Promise<LessonDocument> {
    if (!Types.ObjectId.isValid(dto.courseId)) {
      throw new BadRequestException({ code: 'INVALID_COURSE_ID', message: 'Invalid courseId' });
    }
    if (!Types.ObjectId.isValid(dto.moduleId)) {
      throw new BadRequestException({ code: 'INVALID_MODULE_ID', message: 'Invalid moduleId' });
    }

    const course = await this.courseModel.findById(dto.courseId).exec();
    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    const moduleIndex = course.modules.findIndex(
      (m) =>
        (m as unknown as { _id?: Types.ObjectId; id?: string })._id?.toString() === dto.moduleId ||
        (m as unknown as { _id?: Types.ObjectId; id?: string }).id === dto.moduleId,
    );
    if (moduleIndex === -1) {
      throw new NotFoundException({
        code: 'MODULE_NOT_FOUND',
        message: 'Module not found in this course',
      });
    }

    const targetModule = course.modules[moduleIndex];
    const order = typeof dto.order === 'number' ? dto.order : (targetModule.lessonIds?.length ?? 0);

    const lesson = new this.lessonModel({
      courseId: new Types.ObjectId(dto.courseId),
      moduleId: new Types.ObjectId(dto.moduleId),
      order,
      title: dto.title.trim(),
      type: dto.type as LessonType,
      isFreePreview: dto.isFreePreview ?? false,
      isRequired: dto.isRequired ?? true,
      status: (dto.status ?? 'draft') as LessonStatus,
      durationSec: dto.durationSec ?? 0,
      video: dto.video,
      reading: dto.reading,
      quiz: dto.quiz
        ? {
            quizId:
              dto.quiz.quizId && Types.ObjectId.isValid(dto.quiz.quizId)
                ? new Types.ObjectId(dto.quiz.quizId)
                : undefined,
          }
        : undefined,
      resource: dto.resource,
    });

    const savedLesson = await lesson.save();

    // Link lesson into course module
    if (!targetModule.lessonIds) {
      targetModule.lessonIds = [];
    }
    targetModule.lessonIds.push(new Types.ObjectId(savedLesson._id));
    course.markModified('modules');

    await this.recalculateCourseStats(course, adminId);

    return savedLesson;
  }

  // ==========================================
  // Update Lesson
  // ==========================================

  async updateLesson(id: string, dto: UpdateLessonDto, adminId?: string): Promise<LessonDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Invalid lesson ID' });
    }

    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Lesson not found' });
    }

    const course = await this.courseModel.findById(lesson.courseId).exec();

    // Handle moving lesson across modules if moduleId changed
    if (dto.moduleId && dto.moduleId !== lesson.moduleId.toString()) {
      if (!Types.ObjectId.isValid(dto.moduleId)) {
        throw new BadRequestException({
          code: 'INVALID_MODULE_ID',
          message: 'Invalid new moduleId',
        });
      }

      if (course) {
        // Remove from old module
        const oldMod = course.modules.find(
          (m) =>
            (m as unknown as { _id?: Types.ObjectId; id?: string })._id?.toString() ===
              lesson.moduleId.toString() ||
            (m as unknown as { _id?: Types.ObjectId; id?: string }).id ===
              lesson.moduleId.toString(),
        );
        if (oldMod && oldMod.lessonIds) {
          oldMod.lessonIds = oldMod.lessonIds.filter((lid) => lid.toString() !== id);
        }

        // Add to new module
        const newMod = course.modules.find(
          (m) =>
            (m as unknown as { _id?: Types.ObjectId; id?: string })._id?.toString() ===
              dto.moduleId ||
            (m as unknown as { _id?: Types.ObjectId; id?: string }).id === dto.moduleId,
        );
        if (newMod) {
          if (!newMod.lessonIds) newMod.lessonIds = [];
          newMod.lessonIds.push(new Types.ObjectId(id));
        }
        course.markModified('modules');
      }

      lesson.moduleId = new Types.ObjectId(dto.moduleId);
    }

    if (dto.title !== undefined) lesson.title = dto.title.trim();
    if (dto.order !== undefined) lesson.order = dto.order;
    if (dto.type !== undefined) lesson.type = dto.type as LessonType;
    if (dto.isFreePreview !== undefined) lesson.isFreePreview = dto.isFreePreview;
    if (dto.isRequired !== undefined) lesson.isRequired = dto.isRequired;
    if (dto.status !== undefined) lesson.status = dto.status as LessonStatus;
    if (dto.durationSec !== undefined) lesson.durationSec = dto.durationSec;

    if (dto.video !== undefined) {
      lesson.video = {
        mux: {
          assetId: dto.video?.mux?.assetId ?? lesson.video?.mux?.assetId,
          playbackId: dto.video?.mux?.playbackId ?? lesson.video?.mux?.playbackId,
          status: (dto.video?.mux?.status ??
            lesson.video?.mux?.status ??
            MUX_ASSET_STATUSES.READY) as MuxAssetStatus,
        },
      };
    }

    if (dto.reading !== undefined) {
      lesson.reading = {
        bodyHtml: dto.reading?.bodyHtml ?? lesson.reading?.bodyHtml,
        bodyJson: dto.reading?.bodyJson ?? lesson.reading?.bodyJson,
      };
    }

    if (dto.quiz !== undefined) {
      lesson.quiz = {
        quizId:
          dto.quiz?.quizId && Types.ObjectId.isValid(dto.quiz.quizId)
            ? new Types.ObjectId(dto.quiz.quizId)
            : lesson.quiz?.quizId,
      };
    }

    if (dto.resource !== undefined) {
      lesson.resource = {
        resources: (dto.resource?.resources ??
          lesson.resource?.resources ??
          []) as LessonResourceItem[],
      };
    }

    const updated = await lesson.save();

    if (course) {
      await this.recalculateCourseStats(course, adminId);
    }

    return updated;
  }

  // ==========================================
  // Delete Lesson
  // ==========================================

  async deleteLesson(id: string, adminId?: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Invalid lesson ID' });
    }

    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Lesson not found' });
    }

    // Unlink from course
    const course = await this.courseModel.findById(lesson.courseId).exec();
    if (course) {
      for (const m of course.modules) {
        if (m.lessonIds) {
          m.lessonIds = m.lessonIds.filter((lid) => lid.toString() !== id);
        }
      }
      course.markModified('modules');
      await this.recalculateCourseStats(course, adminId);
    }

    await this.lessonModel.findByIdAndDelete(id).exec();

    return {
      success: true,
      message: 'Lesson deleted successfully',
    };
  }

  // ==========================================
  // Video Assets (CS5)
  // ==========================================

  async getVideoAssets(query: VideoAssetsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      $or: [{ type: 'video' }, { 'video.mux.assetId': { $exists: true, $ne: null } }],
    };

    if (query.courseId && Types.ObjectId.isValid(query.courseId)) {
      filter.courseId = new Types.ObjectId(query.courseId);
    }

    if (query.status) {
      filter['video.mux.status'] = query.status;
    }

    if (query.search) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const [total, lessons] = await Promise.all([
      this.lessonModel.countDocuments(filter).exec(),
      this.lessonModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
    ]);

    const courseIds = [...new Set(lessons.map((l) => l.courseId.toString()))];
    const courses = await this.courseModel
      .find({ _id: { $in: courseIds } })
      .select('title modules')
      .lean()
      .exec();

    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const items: VideoAssetItem[] = lessons.map((l) => {
      const course = courseMap.get(l.courseId.toString());
      const moduleObj = course?.modules?.find(
        (m: { _id?: Types.ObjectId; id?: string }) =>
          (m._id || m.id)?.toString() === l.moduleId.toString(),
      );

      const status = l.video?.mux?.status || 'uploading';

      return {
        id: l._id.toString(),
        sourceType: 'lesson',
        title: l.title,
        courseId: l.courseId.toString(),
        courseTitle: course?.title || 'Unknown Course',
        moduleId: l.moduleId.toString(),
        moduleTitle: moduleObj?.title || 'Unknown Module',
        assetId: l.video?.mux?.assetId,
        playbackId: l.video?.mux?.playbackId,
        status,
        durationSec: l.durationSec || 0,
        isFreePreview: l.isFreePreview,
        updatedAt: ((l as unknown as { updatedAt?: Date }).updatedAt || new Date()).toISOString(),
        error: status === 'errored' ? 'Mux processing failed' : undefined,
      };
    });

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
  // Helper: Recalculate Course Stats
  // ==========================================

  private async recalculateCourseStats(course: CourseDocument, adminId?: string): Promise<void> {
    const allLessonIds = course.modules.flatMap((m) => m.lessonIds || []);
    if (allLessonIds.length === 0) {
      course.stats.lessonCount = 0;
      course.stats.durationSec = 0;
    } else {
      const lessons = await this.lessonModel
        .find({ _id: { $in: allLessonIds } })
        .select('durationSec')
        .exec();

      course.stats.lessonCount = lessons.length;
      course.stats.durationSec = lessons.reduce((acc, l) => acc + (l.durationSec || 0), 0);
    }

    if (adminId && Types.ObjectId.isValid(adminId)) {
      course.updatedBy = new Types.ObjectId(adminId);
    }

    await course.save();
  }
}
