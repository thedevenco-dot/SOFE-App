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
  ENROLLMENT_SOURCES,
  ENROLLMENT_STATUSES,
  LESSON_PROGRESS_STATUSES,
  LESSON_TYPES,
  type LessonProgressStatus,
} from '@sofe/shared';
import {
  Course,
  CourseDocument,
  Enrollment,
  EnrollmentDocument,
  Lesson,
  LessonDocument,
  LessonProgress,
  LessonProgressDocument,
} from '../database/schemas';
import { MuxService } from '../media/mux.service';

export interface LessonProgressUpdateDto {
  watchedSec: number;
  percent: number;
  completed: boolean;
}

@Injectable()
export class LearningService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    private readonly muxService: MuxService,
  ) {}

  /**
   * Helper: Resolves a Course by ObjectId string or URL slug.
   */
  private async findCourseByIdOrSlug(idOrSlug: string): Promise<CourseDocument> {
    const isObjectId = Types.ObjectId.isValid(idOrSlug) && idOrSlug.length === 24;
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const course = await this.courseModel.findOne(query);
    if (!course) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Course not found',
      });
    }
    return course;
  }

  /**
   * Verifies if a user has an active enrollment or if the course is free.
   */
  async checkCourseAccess(userId: string, courseId: Types.ObjectId): Promise<boolean> {
    const course = await this.courseModel.findById(courseId);
    if (!course) return false;
    if (course.priceInr === 0) return true;

    const enrollment = await this.enrollmentModel.findOne({
      userId: new Types.ObjectId(userId),
      courseId,
      status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
    });

    return Boolean(enrollment);
  }

  /**
   * GET /enrollments
   * Lists all active or completed enrollments for the learner with populated course info.
   */
  async listEnrollments(userId: string) {
    const enrollments = await this.enrollmentModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
      })
      .sort({ 'progress.lastAccessedAt': -1 })
      .populate({
        path: 'courseId',
        select: 'title slug subtitle thumbnailUrl level priceInr stats instructors categoryId',
        populate: [
          { path: 'instructors', select: 'name title avatarUrl' },
          { path: 'categoryId', select: 'name slug' },
        ],
      })
      .populate('progress.lastLessonId', 'title order type durationSec');

    return enrollments;
  }

  /**
   * POST /courses/:id/enroll
   * Enrolls a user in a free course directly.
   */
  async enrollFreeCourse(userId: string, courseIdOrSlug: string) {
    const course = await this.findCourseByIdOrSlug(courseIdOrSlug);
    if (course.priceInr > 0) {
      throw new BadRequestException({
        code: ERROR_CODES.PAYMENT_FAILED,
        message: 'Paid courses require checkout and payment before enrollment.',
      });
    }

    const uId = new Types.ObjectId(userId);
    const cId = course._id as Types.ObjectId;

    let enrollment = await this.enrollmentModel.findOne({ userId: uId, courseId: cId });
    if (!enrollment) {
      enrollment = await this.enrollmentModel.create({
        userId: uId,
        courseId: cId,
        source: ENROLLMENT_SOURCES.FREE,
        status: ENROLLMENT_STATUSES.ACTIVE,
        progress: {
          completedLessonCount: 0,
          percent: 0,
          lastAccessedAt: new Date(),
        },
      });

      // Increment course enrolled count stat
      await this.courseModel.findByIdAndUpdate(cId, {
        $inc: { 'stats.enrolledCount': 1 },
      });
    }

    return enrollment;
  }

  /**
   * GET /courses/:id/curriculum
   * Returns complete course curriculum with user's lesson progress.
   */
  async getCourseCurriculum(userId: string, courseIdOrSlug: string) {
    const course = await this.findCourseByIdOrSlug(courseIdOrSlug);
    const hasAccess = await this.checkCourseAccess(userId, course._id as Types.ObjectId);

    if (!hasAccess) {
      throw new ForbiddenException({
        code: ERROR_CODES.ENROLLMENT_REQUIRED,
        message: 'Enrollment required to access course curriculum',
      });
    }

    // Fetch all lessons for this course
    const lessons = await this.lessonModel
      .find({ courseId: course._id })
      .sort({ moduleId: 1, order: 1 });

    // Fetch user progress for all lessons in this course
    const progressList = await this.lessonProgressModel.find({
      userId: new Types.ObjectId(userId),
      courseId: course._id,
    });

    const progressMap = new Map<string, LessonProgressDocument>();
    for (const prog of progressList) {
      progressMap.set(prog.lessonId.toString(), prog);
    }

    // Stitch modules from course.modules with lessons & progress
    const modules = (course.modules || []).map((mod) => {
      const modIdStr = mod._id ? mod._id.toString() : '';
      const moduleLessons = lessons.filter((l) => l.moduleId.toString() === modIdStr);
      return {
        id: modIdStr,
        title: mod.title,
        order: mod.order,
        lessons: moduleLessons.map((l) => {
          const prog = progressMap.get(l._id.toString());
          return {
            id: l._id,
            title: l.title,
            type: l.type,
            durationSec: l.durationSec || 0,
            order: l.order,
            isFreePreview: l.isFreePreview,
            isRequired: l.isRequired,
            status: prog?.status || 'not_started',
            watchedSec: prog?.watchedSec || 0,
            percent: prog?.percent || 0,
            completedAt: prog?.completedAt,
          };
        }),
      };
    });

    return {
      courseId: course._id,
      courseTitle: course.title,
      modules,
    };
  }

  /**
   * GET /courses/:id/resources
   * Returns all downloadable resources for the course.
   */
  async getCourseResources(userId: string, courseIdOrSlug: string) {
    const course = await this.findCourseByIdOrSlug(courseIdOrSlug);
    const hasAccess = await this.checkCourseAccess(userId, course._id as Types.ObjectId);

    if (!hasAccess) {
      throw new ForbiddenException({
        code: ERROR_CODES.ENROLLMENT_REQUIRED,
        message: 'Enrollment required to access course resources',
      });
    }

    const lessons = await this.lessonModel.find({
      courseId: course._id,
      $or: [{ type: LESSON_TYPES.RESOURCE }, { 'resource.resources.0': { $exists: true } }],
    });

    const resources = lessons.flatMap((l) =>
      (l.resource?.resources || []).map((r) => ({
        lessonId: l._id,
        lessonTitle: l.title,
        title: r.title,
        url: r.url,
        kind: r.kind,
      })),
    );

    return {
      courseId: course._id,
      resources,
    };
  }

  /**
   * GET /courses/continue
   * Returns the learner's most recently accessed unfinished lesson.
   */
  async getContinueLesson(userId: string, courseIdOrSlug?: string) {
    const uId = new Types.ObjectId(userId);

    let targetCourseId: Types.ObjectId | undefined;
    if (courseIdOrSlug) {
      const course = await this.findCourseByIdOrSlug(courseIdOrSlug);
      targetCourseId = course._id as Types.ObjectId;
    }

    const enrollmentQuery: Record<string, unknown> = {
      userId: uId,
      status: ENROLLMENT_STATUSES.ACTIVE,
    };
    if (targetCourseId) {
      enrollmentQuery.courseId = targetCourseId;
    }

    const activeEnrollment = await this.enrollmentModel
      .findOne(enrollmentQuery)
      .sort({ 'progress.lastAccessedAt': -1 });

    if (!activeEnrollment) {
      return null;
    }

    // Find all lessons for this course
    const lessons = await this.lessonModel
      .find({ courseId: activeEnrollment.courseId })
      .sort({ moduleId: 1, order: 1 });

    if (lessons.length === 0) {
      return null;
    }

    // Check user's lesson progress
    const progressList = await this.lessonProgressModel.find({
      userId: uId,
      courseId: activeEnrollment.courseId,
    });
    const completedLessonIds = new Set(
      progressList
        .filter((p) => p.status === LESSON_PROGRESS_STATUSES.COMPLETED)
        .map((p) => p.lessonId.toString()),
    );

    // If lastLessonId is unfinished, return it
    if (activeEnrollment.progress.lastLessonId) {
      const lastId = activeEnrollment.progress.lastLessonId.toString();
      if (!completedLessonIds.has(lastId)) {
        const lastLesson = lessons.find((l) => l._id.toString() === lastId);
        if (lastLesson) {
          const prog = progressList.find((p) => p.lessonId.toString() === lastId);
          return {
            courseId: activeEnrollment.courseId,
            lesson: lastLesson,
            progress: prog || null,
          };
        }
      }
    }

    // Otherwise find the first uncompleted lesson in order
    const nextUncompleted = lessons.find((l) => !completedLessonIds.has(l._id.toString()));
    if (nextUncompleted) {
      const prog = progressList.find(
        (p) => p.lessonId.toString() === nextUncompleted._id.toString(),
      );
      return {
        courseId: activeEnrollment.courseId,
        lesson: nextUncompleted,
        progress: prog || null,
      };
    }

    // If all completed, return first lesson
    return {
      courseId: activeEnrollment.courseId,
      lesson: lessons[0],
      progress:
        progressList.find((p) => p.lessonId.toString() === lessons[0]._id.toString()) || null,
    };
  }

  /**
   * GET /lessons/:id
   * Lesson access gate: checks if user has access (free preview or active enrollment).
   */
  async getLesson(userId: string, lessonId: string) {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Invalid lesson ID',
      });
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lesson not found',
      });
    }

    // Access check: Free preview grants access without enrollment
    if (!lesson.isFreePreview) {
      const hasAccess = await this.checkCourseAccess(userId, lesson.courseId);
      if (!hasAccess) {
        throw new ForbiddenException({
          code: ERROR_CODES.ENROLLMENT_REQUIRED,
          message: 'Enrollment required to access this lesson',
        });
      }
    }

    // Get learner's progress on this lesson
    const progress = await this.lessonProgressModel.findOne({
      userId: new Types.ObjectId(userId),
      lessonId: lesson._id,
    });

    return {
      lesson,
      progress: progress || null,
    };
  }

  /**
   * POST /lessons/:id/playback-token
   * Access check + signed Mux playback token generation.
   */
  async getPlaybackToken(userId: string, lessonId: string) {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Invalid lesson ID',
      });
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lesson not found',
      });
    }

    if (lesson.type !== LESSON_TYPES.VIDEO) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Playback tokens are only available for video lessons',
      });
    }

    const playbackId = lesson.video?.mux?.playbackId;
    if (!playbackId) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'No video playback source configured for this lesson',
      });
    }

    // Access Gate
    if (!lesson.isFreePreview) {
      const hasAccess = await this.checkCourseAccess(userId, lesson.courseId);
      if (!hasAccess) {
        throw new ForbiddenException({
          code: ERROR_CODES.ENROLLMENT_REQUIRED,
          message: 'Enrollment required to generate playback token',
        });
      }
    }

    const playbackToken = this.muxService.generatePlaybackToken(playbackId);

    return {
      playbackToken,
      playbackId,
    };
  }

  /**
   * POST /lessons/:id/progress
   * Updates lesson progress, recalculates course completion percentage.
   */
  async updateProgress(userId: string, lessonId: string, dto: LessonProgressUpdateDto) {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Invalid lesson ID',
      });
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lesson not found',
      });
    }

    // Access Check: free preview lessons can track progress, but paid non-preview require enrollment
    if (!lesson.isFreePreview) {
      const hasAccess = await this.checkCourseAccess(userId, lesson.courseId);
      if (!hasAccess) {
        throw new ForbiddenException({
          code: ERROR_CODES.ENROLLMENT_REQUIRED,
          message: 'Enrollment required to update progress',
        });
      }
    }

    const uId = new Types.ObjectId(userId);
    const lId = lesson._id as Types.ObjectId;
    const cId = lesson.courseId;

    const newStatus: LessonProgressStatus = dto.completed
      ? LESSON_PROGRESS_STATUSES.COMPLETED
      : LESSON_PROGRESS_STATUSES.IN_PROGRESS;

    // Upsert lesson progress
    const progress = await this.lessonProgressModel.findOneAndUpdate(
      { userId: uId, lessonId: lId },
      {
        $set: {
          courseId: cId,
          status: newStatus,
          watchedSec: dto.watchedSec,
          percent: dto.percent,
          lastEventAt: new Date(),
          ...(dto.completed ? { completedAt: new Date() } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Update enrollment progress metrics if enrollment exists
    const enrollment = await this.enrollmentModel.findOne({
      userId: uId,
      courseId: cId,
    });

    if (enrollment) {
      // Count total required lessons for this course
      const totalRequired = await this.lessonModel.countDocuments({
        courseId: cId,
        isRequired: true,
      });

      // Find all completed required lessons for this user
      const completedProgress = await this.lessonProgressModel.find({
        userId: uId,
        courseId: cId,
        status: LESSON_PROGRESS_STATUSES.COMPLETED,
      });

      const completedLessonIds = completedProgress.map((p) => p.lessonId);
      const completedRequiredCount = await this.lessonModel.countDocuments({
        _id: { $in: completedLessonIds },
        courseId: cId,
        isRequired: true,
      });

      const percent =
        totalRequired > 0
          ? Math.min(100, Math.round((completedRequiredCount / totalRequired) * 100))
          : 100;

      const isCourseCompleted = percent === 100 && totalRequired > 0;

      enrollment.progress.completedLessonCount = completedRequiredCount;
      enrollment.progress.percent = percent;
      enrollment.progress.lastLessonId = lId;
      enrollment.progress.lastAccessedAt = new Date();

      if (isCourseCompleted && enrollment.status !== ENROLLMENT_STATUSES.COMPLETED) {
        enrollment.status = ENROLLMENT_STATUSES.COMPLETED;
        enrollment.completedAt = new Date();
      }

      await enrollment.save();
    }

    return {
      progress,
      enrollmentProgress: enrollment ? enrollment.progress : null,
      courseCompleted: enrollment?.status === ENROLLMENT_STATUSES.COMPLETED,
    };
  }

  /**
   * POST /lessons/:id/quiz/submit
   * Submits quiz answers, grades and marks lesson completed if score >= 80%.
   */
  async submitLessonQuiz(userId: string, lessonId: string, score: number) {
    if (score < 0 || score > 100) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Score must be between 0 and 100',
      });
    }

    const isPassed = score >= 80;
    return this.updateProgress(userId, lessonId, {
      watchedSec: 0,
      percent: score,
      completed: isPassed,
    });
  }
}
