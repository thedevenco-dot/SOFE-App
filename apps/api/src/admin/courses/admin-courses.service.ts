import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ContentVersion,
  ContentVersionDocument,
  Course,
  CourseDocument,
  Lesson,
  LessonDocument,
} from '../../database/schemas';
import { CourseDto, CourseModuleDto } from '@sofe/shared';

export interface CourseFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  priceType?: 'free' | 'paid';
  search?: string;
}

export interface PublishCheckItem {
  key: string;
  label: string;
  passed: boolean;
  details?: string;
}

export interface PublishChecklistResult {
  canPublish: boolean;
  checks: PublishCheckItem[];
}

@Injectable()
export class AdminCoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(ContentVersion.name)
    private readonly contentVersionModel: Model<ContentVersionDocument>,
  ) {}

  // ==========================================
  // List & Retrieve (CS1)
  // ==========================================

  async listCourses(query: CourseFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.categoryId) {
      if (Types.ObjectId.isValid(query.categoryId)) {
        filter.categoryId = new Types.ObjectId(query.categoryId);
      }
    }

    if (query.priceType === 'free') {
      filter.priceInr = 0;
    } else if (query.priceType === 'paid') {
      filter.priceInr = { $gt: 0 };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { slug: { $regex: term, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.courseModel
        .find(filter)
        .populate('categoryId', 'name slug iconUrl')
        .populate('instructorIds', 'name avatarUrl title')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.courseModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCourseById(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    const course = await this.courseModel
      .findById(id)
      .populate('categoryId', 'name slug iconUrl')
      .populate('instructorIds', 'name avatarUrl title bio links')
      .exec();

    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    // Populate lessons inside modules
    const allLessonIds = course.modules.flatMap((m) => m.lessonIds);
    if (allLessonIds.length > 0) {
      const lessons = await this.lessonModel
        .find({ _id: { $in: allLessonIds } })
        .select('title type status durationSec isFreePreview isRequired video quiz reading')
        .exec();

      const lessonMap = new Map(lessons.map((l) => [l._id.toString(), l]));

      // Attach populated modules to virtual response object
      const populatedModules = course.modules.map((m) => ({
        _id: m._id,
        title: m.title,
        order: m.order,
        lessonIds: m.lessonIds,
        lessons: m.lessonIds.map((lid) => lessonMap.get(lid.toString())).filter(Boolean),
      }));

      const courseObj = course.toObject();
      courseObj.modules = populatedModules as unknown as typeof course.modules;
      return courseObj as unknown as CourseDocument;
    }

    return course;
  }

  // ==========================================
  // Create, Update, Curriculum (CS2, CS3, CS6)
  // ==========================================

  async createCourse(dto: Partial<CourseDto>, adminId?: string): Promise<CourseDocument> {
    const title = dto.title?.trim();
    if (!title) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Course title is required',
      });
    }

    const slug = (
      dto.slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    ).toLowerCase();

    const existingSlug = await this.courseModel.findOne({ slug });
    if (existingSlug) {
      throw new ConflictException({
        code: 'COURSE_EXISTS',
        message: 'A course with this slug already exists',
      });
    }

    const course = new this.courseModel({
      ...dto,
      title,
      slug,
      status: dto.status || 'draft',
      version: 1,
      thumbnailUrl:
        dto.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
      instructorIds: (dto.instructorIds || []).map((id) => new Types.ObjectId(id)),
      createdBy: adminId ? new Types.ObjectId(adminId) : undefined,
      updatedBy: adminId ? new Types.ObjectId(adminId) : undefined,
      stats: {
        enrolledCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        lessonCount: 0,
        durationSec: 0,
      },
    });

    return course.save();
  }

  async updateCourse(
    id: string,
    dto: Partial<CourseDto>,
    adminId?: string,
  ): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    if (dto.slug) {
      const conflict = await this.courseModel.findOne({
        _id: { $ne: id },
        slug: dto.slug.toLowerCase().trim(),
      });
      if (conflict) {
        throw new ConflictException({
          code: 'COURSE_EXISTS',
          message: 'Another course with this slug already exists',
        });
      }
    }

    const updatePayload: Record<string, unknown> = {
      ...(dto.title && { title: dto.title.trim() }),
      ...(dto.slug && { slug: dto.slug.toLowerCase().trim() }),
      ...(dto.subtitle !== undefined && { subtitle: dto.subtitle?.trim() }),
      ...(dto.descriptionHtml !== undefined && { descriptionHtml: dto.descriptionHtml }),
      ...(dto.descriptionJson !== undefined && { descriptionJson: dto.descriptionJson }),
      ...(dto.thumbnailUrl && { thumbnailUrl: dto.thumbnailUrl.trim() }),
      ...(dto.previewMuxPlaybackId !== undefined && {
        previewMuxPlaybackId: dto.previewMuxPlaybackId,
      }),
      ...(dto.categoryId && { categoryId: new Types.ObjectId(dto.categoryId) }),
      ...(dto.instructorIds !== undefined && {
        instructorIds: dto.instructorIds.map((instId) => new Types.ObjectId(instId)),
      }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.level && { level: dto.level }),
      ...(dto.language && { language: dto.language }),
      ...(dto.priceInr !== undefined && { priceInr: dto.priceInr }),
      ...(dto.compareAtPriceInr !== undefined && { compareAtPriceInr: dto.compareAtPriceInr }),
      ...(dto.iapProductIds !== undefined && { iapProductIds: dto.iapProductIds }),
      ...(dto.redeemableWithPoints !== undefined && {
        redeemableWithPoints: dto.redeemableWithPoints,
      }),
      ...(dto.seo !== undefined && { seo: dto.seo }),
      ...(adminId && { updatedBy: new Types.ObjectId(adminId) }),
    };

    const updated = await this.courseModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .populate('categoryId', 'name slug iconUrl')
      .populate('instructorIds', 'name avatarUrl title')
      .exec();

    if (!updated) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    return updated;
  }

  async updateCurriculum(
    id: string,
    modules: CourseModuleDto[],
    adminId?: string,
  ): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    // Format modules with ObjectIds
    const formattedModules = modules.map((m, idx) => ({
      _id:
        m._id && Types.ObjectId.isValid(m._id) ? new Types.ObjectId(m._id) : new Types.ObjectId(),
      title: m.title.trim(),
      order: m.order ?? idx,
      lessonIds: (m.lessonIds || []).map((lid: string | Types.ObjectId) => new Types.ObjectId(lid)),
    }));

    // Recalculate stats
    const allLessonIds = formattedModules.flatMap((m) => m.lessonIds);
    let totalDurationSec = 0;
    if (allLessonIds.length > 0) {
      const lessons = await this.lessonModel
        .find({ _id: { $in: allLessonIds } })
        .select('durationSec')
        .exec();
      totalDurationSec = lessons.reduce((acc, l) => acc + (l.durationSec || 0), 0);
    }

    course.modules = formattedModules as unknown as typeof course.modules;
    course.stats.lessonCount = allLessonIds.length;
    course.stats.durationSec = totalDurationSec;
    if (adminId) {
      course.updatedBy = new Types.ObjectId(adminId);
    }

    return course.save();
  }

  // ==========================================
  // Publish Checklist & Publish/Unpublish (CS6)
  // ==========================================

  async getPublishChecklist(id: string): Promise<PublishChecklistResult> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    const allLessonIds = course.modules.flatMap((m) => m.lessonIds);
    const lessons =
      allLessonIds.length > 0
        ? await this.lessonModel.find({ _id: { $in: allLessonIds } }).exec()
        : [];

    const checks: PublishCheckItem[] = [];

    // 1. Title & Slug
    const hasTitleAndSlug = Boolean(course.title?.trim() && course.slug?.trim());
    checks.push({
      key: 'title_slug',
      label: 'Title and Slug configured',
      passed: hasTitleAndSlug,
      details: hasTitleAndSlug ? `Slug: ${course.slug}` : 'Title or slug is missing',
    });

    // 2. Thumbnail
    const hasThumbnail = Boolean(course.thumbnailUrl && course.thumbnailUrl.startsWith('http'));
    checks.push({
      key: 'thumbnail',
      label: 'Course thumbnail present (16:9)',
      passed: hasThumbnail,
      details: hasThumbnail ? 'Thumbnail configured' : 'Missing or invalid thumbnail URL',
    });

    // 3. Category
    const hasCategory = Boolean(course.categoryId);
    checks.push({
      key: 'category',
      label: 'Curriculum category assigned',
      passed: hasCategory,
      details: hasCategory ? 'Category assigned' : 'No category selected',
    });

    // 4. Instructor
    const hasInstructor = Boolean(course.instructorIds && course.instructorIds.length > 0);
    checks.push({
      key: 'instructor',
      label: 'At least 1 instructor assigned',
      passed: hasInstructor,
      details: hasInstructor
        ? `${course.instructorIds.length} instructor(s) assigned`
        : 'No instructors assigned',
    });

    // 5. Description at least 100 chars
    const descLength = (course.descriptionHtml || '').replace(/<[^>]*>/g, '').trim().length;
    const hasDescription = descLength >= 100;
    checks.push({
      key: 'description',
      label: 'Course description at least 100 characters',
      passed: hasDescription,
      details: `${descLength}/100 characters`,
    });

    // 6. At least 1 module and 3 published lessons
    const publishedLessons = lessons.filter((l) => l.status === 'published');
    const hasCurriculum = course.modules.length >= 1 && publishedLessons.length >= 3;
    checks.push({
      key: 'curriculum',
      label: 'At least 1 module and 3 published lessons',
      passed: hasCurriculum,
      details: `${course.modules.length} modules, ${publishedLessons.length}/3 published lessons`,
    });

    // 7. Video lessons ready in Mux
    const videoLessons = lessons.filter((l) => l.type === 'video');
    const unreadyVideos = videoLessons.filter((l) => l.video?.mux?.status !== 'ready');
    const allVideosReady = unreadyVideos.length === 0;
    checks.push({
      key: 'videos_ready',
      label: 'All video assets processed & ready on Mux',
      passed: allVideosReady,
      details: allVideosReady
        ? `${videoLessons.length} video(s) ready`
        : `${unreadyVideos.length} video(s) still processing or errored`,
    });

    // 8. Pricing & IAP Product IDs
    const isFree = course.priceInr === 0;
    const hasIap = Boolean(course.iapProductIds?.ios && course.iapProductIds?.android);
    const priceValid = isFree || hasIap || course.redeemableWithPoints;
    checks.push({
      key: 'pricing_iap',
      label: 'Pricing set (Free or Paid with IAP product IDs / Points)',
      passed: priceValid,
      details: isFree
        ? 'Free course (₹0)'
        : hasIap
          ? `Paid ₹${(course.priceInr / 100).toFixed(2)} with iOS & Android IAP`
          : 'Paid courses require iOS and Android IAP IDs or Points redemption',
    });

    const canPublish = checks.every((c) => c.passed);

    return { canPublish, checks };
  }

  async publishCourse(id: string, adminId?: string): Promise<CourseDocument> {
    const checklist = await this.getPublishChecklist(id);
    if (!checklist.canPublish) {
      throw new BadRequestException({
        code: 'COURSE_PUBLISH_BLOCKED',
        message: 'Course does not meet all publishing requirements',
        details: checklist.checks.filter((c) => !c.passed),
      });
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    // Increment version
    const nextVersion = (course.version || 1) + 1;

    // Snapshot in contentVersions
    const versionSnapshot = new this.contentVersionModel({
      entityType: 'course',
      entityId: course._id,
      version: nextVersion,
      snapshot: course.toObject(),
      byAdminId: adminId ? new Types.ObjectId(adminId) : undefined,
    });
    await versionSnapshot.save();

    // Update status and published timestamp
    course.version = nextVersion;
    course.status = 'published';
    course.publishedAt = new Date();
    if (adminId) {
      course.updatedBy = new Types.ObjectId(adminId);
    }

    return course.save();
  }

  async unpublishCourse(id: string, adminId?: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    course.status = 'draft';
    if (adminId) {
      course.updatedBy = new Types.ObjectId(adminId);
    }

    return course.save();
  }

  async duplicateCourse(id: string, adminId?: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    const original = await this.courseModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const clonedObj = original.toObject() as unknown as Record<string, unknown>;

    delete clonedObj._id;
    delete clonedObj['createdAt'];
    delete clonedObj['updatedAt'];

    const duplicate = new this.courseModel({
      ...clonedObj,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      status: 'draft',
      version: 1,
      publishedAt: undefined,
      scheduledAt: undefined,
      createdBy: adminId ? new Types.ObjectId(adminId) : undefined,
      updatedBy: adminId ? new Types.ObjectId(adminId) : undefined,
      stats: {
        enrolledCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        lessonCount: original.stats?.lessonCount || 0,
        durationSec: original.stats?.durationSec || 0,
      },
    });

    return duplicate.save();
  }

  async archiveCourse(id: string, adminId?: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Invalid course ID' });
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }

    course.status = 'archived';
    if (adminId) {
      course.updatedBy = new Types.ObjectId(adminId);
    }

    return course.save();
  }
}
