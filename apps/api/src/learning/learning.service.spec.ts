import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ERROR_CODES,
  ENROLLMENT_STATUSES,
  LESSON_PROGRESS_STATUSES,
  LESSON_TYPES,
} from '@sofe/shared';
import { LearningService } from './learning.service';
import { Course, Enrollment, Lesson, LessonProgress } from '../database/schemas';
import { MuxService } from '../media/mux.service';

describe('LearningService (Task T2.12)', () => {
  let service: LearningService;

  const mockUserId = new Types.ObjectId().toString();
  const mockCourseId = new Types.ObjectId();
  const mockLessonId = new Types.ObjectId();
  const mockModuleId = new Types.ObjectId();

  const mockCourse = {
    _id: mockCourseId,
    title: 'Venture Building Masterclass',
    slug: 'venture-building-masterclass',
    priceInr: 1499900,
    modules: [
      {
        _id: mockModuleId,
        id: mockModuleId.toString(),
        title: 'Module 1: Foundations',
        order: 1,
      },
    ],
    stats: { enrolledCount: 10 },
  };

  const mockFreeCourse = {
    _id: new Types.ObjectId(),
    title: 'Free Intro to Startups',
    slug: 'free-intro-startups',
    priceInr: 0,
    modules: [],
    stats: { enrolledCount: 50 },
  };

  const mockPaidLesson = {
    _id: mockLessonId,
    courseId: mockCourseId,
    moduleId: mockModuleId,
    title: 'Unit Economics Deep Dive',
    type: LESSON_TYPES.VIDEO,
    isFreePreview: false,
    isRequired: true,
    durationSec: 1200,
    order: 1,
    video: {
      mux: {
        playbackId: 'test-playback-id-123',
      },
    },
  };

  const mockPreviewLesson = {
    _id: new Types.ObjectId(),
    courseId: mockCourseId,
    moduleId: mockModuleId,
    title: 'Free Preview: Course Overview',
    type: LESSON_TYPES.VIDEO,
    isFreePreview: true,
    isRequired: true,
    durationSec: 600,
    order: 0,
    video: {
      mux: {
        playbackId: 'preview-playback-id-456',
      },
    },
  };

  const mockEnrollmentModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockLessonProgressModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockCourseModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockLessonModel = {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockMuxService = {
    generatePlaybackToken: jest.fn().mockReturnValue('signed-mux-jwt-token-xyz'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        { provide: getModelToken(Enrollment.name), useValue: mockEnrollmentModel },
        { provide: getModelToken(LessonProgress.name), useValue: mockLessonProgressModel },
        { provide: getModelToken(Course.name), useValue: mockCourseModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        { provide: MuxService, useValue: mockMuxService },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
  });

  describe('Lesson Access Gate (Acceptance Criteria)', () => {
    it('throws 403 ENROLLMENT_REQUIRED when unpaid user accesses a paid non-preview lesson', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPaidLesson);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      // No active enrollment
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      await expect(service.getLesson(mockUserId, mockLessonId.toString())).rejects.toThrow(
        ForbiddenException,
      );

      try {
        await service.getLesson(mockUserId, mockLessonId.toString());
      } catch (err) {
        const response = (err as ForbiddenException).getResponse() as { code: string };
        expect(response.code).toBe(ERROR_CODES.ENROLLMENT_REQUIRED);
      }
    });

    it('grants access to a free preview lesson without requiring enrollment', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPreviewLesson);
      mockLessonProgressModel.findOne.mockResolvedValue(null);

      const result = await service.getLesson(mockUserId, mockPreviewLesson._id.toString());
      expect(result.lesson).toEqual(mockPreviewLesson);
      expect(mockEnrollmentModel.findOne).not.toHaveBeenCalled();
    });

    it('grants access to paid lessons when the user has an active enrollment', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPaidLesson);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockEnrollmentModel.findOne.mockResolvedValue({
        userId: new Types.ObjectId(mockUserId),
        courseId: mockCourseId,
        status: ENROLLMENT_STATUSES.ACTIVE,
      });
      mockLessonProgressModel.findOne.mockResolvedValue({
        status: LESSON_PROGRESS_STATUSES.IN_PROGRESS,
        watchedSec: 300,
        percent: 25,
      });

      const result = await service.getLesson(mockUserId, mockLessonId.toString());
      expect(result.lesson).toEqual(mockPaidLesson);
      expect(result.progress?.watchedSec).toBe(300);
    });

    it('grants access to lessons of free courses (priceInr === 0)', async () => {
      const freeLesson = {
        _id: new Types.ObjectId(),
        courseId: mockFreeCourse._id,
        title: 'Free Lesson',
        isFreePreview: false,
      };
      mockLessonModel.findById.mockResolvedValue(freeLesson);
      mockCourseModel.findById.mockResolvedValue(mockFreeCourse);
      mockLessonProgressModel.findOne.mockResolvedValue(null);

      const result = await service.getLesson(mockUserId, freeLesson._id.toString());
      expect(result.lesson).toEqual(freeLesson);
    });
  });

  describe('Playback Tokens (Mux Signed Tokens)', () => {
    it('throws 403 ENROLLMENT_REQUIRED if user is not enrolled and lesson is not free preview', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPaidLesson);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      await expect(service.getPlaybackToken(mockUserId, mockLessonId.toString())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('generates signed token for free preview video without enrollment', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPreviewLesson);

      const result = await service.getPlaybackToken(mockUserId, mockPreviewLesson._id.toString());
      expect(result.playbackToken).toBe('signed-mux-jwt-token-xyz');
      expect(result.playbackId).toBe('preview-playback-id-456');
      expect(mockMuxService.generatePlaybackToken).toHaveBeenCalledWith('preview-playback-id-456');
    });

    it('generates signed token for paid lesson when enrolled', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPaidLesson);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockEnrollmentModel.findOne.mockResolvedValue({ status: ENROLLMENT_STATUSES.ACTIVE });

      const result = await service.getPlaybackToken(mockUserId, mockLessonId.toString());
      expect(result.playbackToken).toBe('signed-mux-jwt-token-xyz');
      expect(result.playbackId).toBe('test-playback-id-123');
      expect(mockMuxService.generatePlaybackToken).toHaveBeenCalledWith('test-playback-id-123');
    });
  });

  describe('Progress Tracking & Course Completion', () => {
    it('updates lesson progress and recalculates course completion', async () => {
      mockLessonModel.findById.mockResolvedValue(mockPaidLesson);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockEnrollmentModel.findOne.mockResolvedValue({
        userId: new Types.ObjectId(mockUserId),
        courseId: mockCourseId,
        status: ENROLLMENT_STATUSES.ACTIVE,
        progress: { completedLessonCount: 0, percent: 0 },
        save: jest.fn().mockResolvedValue(true),
      });

      mockLessonProgressModel.findOneAndUpdate.mockResolvedValue({
        status: LESSON_PROGRESS_STATUSES.COMPLETED,
        watchedSec: 1200,
        percent: 100,
      });

      // 2 required lessons total in course, 2 completed
      mockLessonModel.countDocuments
        .mockResolvedValueOnce(2) // totalRequired
        .mockResolvedValueOnce(2); // completedRequiredCount

      mockLessonProgressModel.find.mockResolvedValue([
        { lessonId: mockLessonId, status: LESSON_PROGRESS_STATUSES.COMPLETED },
        { lessonId: mockPreviewLesson._id, status: LESSON_PROGRESS_STATUSES.COMPLETED },
      ]);

      const result = await service.updateProgress(mockUserId, mockLessonId.toString(), {
        watchedSec: 1200,
        percent: 100,
        completed: true,
      });

      expect(result.progress.status).toBe(LESSON_PROGRESS_STATUSES.COMPLETED);
      expect(result.enrollmentProgress?.percent).toBe(100);
      expect(result.courseCompleted).toBe(true);
    });
  });

  describe('Curriculum Delivery', () => {
    it('throws 403 ENROLLMENT_REQUIRED if user is not enrolled in paid course', async () => {
      mockCourseModel.findOne.mockResolvedValue(mockCourse);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      await expect(
        service.getCourseCurriculum(mockUserId, mockCourseId.toString()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns curriculum outline with progress when user is enrolled', async () => {
      mockCourseModel.findOne.mockResolvedValue(mockCourse);
      mockCourseModel.findById.mockResolvedValue(mockCourse);
      mockEnrollmentModel.findOne.mockResolvedValue({ status: ENROLLMENT_STATUSES.ACTIVE });

      const lessonList = [mockPreviewLesson, mockPaidLesson];
      mockLessonModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(lessonList),
      });

      mockLessonProgressModel.find.mockResolvedValue([
        {
          lessonId: mockPreviewLesson._id,
          status: LESSON_PROGRESS_STATUSES.COMPLETED,
          watchedSec: 600,
          percent: 100,
        },
      ]);

      const curriculum = await service.getCourseCurriculum(mockUserId, mockCourseId.toString());
      expect(curriculum.modules.length).toBe(1);
      const firstModule = curriculum.modules[0];
      expect(firstModule.lessons.length).toBe(2);
      expect(firstModule.lessons[0].status).toBe(LESSON_PROGRESS_STATUSES.COMPLETED);
      expect(firstModule.lessons[1].status).toBe('not_started');
    });
  });

  describe('Continue Learning', () => {
    it('returns the last accessed unfinished lesson', async () => {
      const activeEnrollment = {
        courseId: mockCourseId,
        progress: {
          lastLessonId: mockPaidLesson._id,
          lastAccessedAt: new Date(),
        },
      };

      mockEnrollmentModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(activeEnrollment),
      });

      mockLessonModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockPreviewLesson, mockPaidLesson]),
      });

      // Preview is completed, paid is unfinished
      mockLessonProgressModel.find.mockResolvedValue([
        { lessonId: mockPreviewLesson._id, status: LESSON_PROGRESS_STATUSES.COMPLETED },
        {
          lessonId: mockPaidLesson._id,
          status: LESSON_PROGRESS_STATUSES.IN_PROGRESS,
          watchedSec: 300,
        },
      ]);

      const next = await service.getContinueLesson(mockUserId);
      expect(next).not.toBeNull();
      expect(next?.lesson._id).toEqual(mockPaidLesson._id);
      expect(next?.progress?.watchedSec).toBe(300);
    });
  });
});
