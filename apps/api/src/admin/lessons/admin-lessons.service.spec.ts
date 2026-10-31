import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { AdminLessonsService } from './admin-lessons.service';

describe('AdminLessonsService', () => {
  let service: AdminLessonsService;

  const validCourseId = new Types.ObjectId().toHexString();
  const validModuleId = new Types.ObjectId().toHexString();
  const validLessonId = new Types.ObjectId().toHexString();

  const mockLesson = {
    _id: validLessonId,
    courseId: new Types.ObjectId(validCourseId),
    moduleId: new Types.ObjectId(validModuleId),
    order: 0,
    title: 'Introduction to Pitching',
    type: 'video',
    isFreePreview: true,
    isRequired: true,
    status: 'published',
    durationSec: 420,
    video: {
      mux: {
        assetId: 'mux-asset-123',
        playbackId: 'mux-playback-123',
        status: 'ready',
      },
    },
    reading: {},
    quiz: {},
    resource: { resources: [] },
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockReturnValue({
      _id: validLessonId,
      courseId: validCourseId,
      moduleId: validModuleId,
      title: 'Introduction to Pitching',
      type: 'video',
      status: 'published',
      durationSec: 420,
      video: {
        mux: {
          assetId: 'mux-asset-123',
          playbackId: 'mux-playback-123',
          status: 'ready',
        },
      },
    }),
  };

  const mockCourse = {
    _id: validCourseId,
    title: 'Pre-Seed Fundraising Masterclass',
    slug: 'pre-seed-fundraising-masterclass',
    modules: [
      {
        _id: new Types.ObjectId(validModuleId),
        title: 'Module 1: The Basics',
        order: 0,
        lessonIds: [validLessonId],
      },
    ],
    stats: {
      lessonCount: 1,
      durationSec: 420,
    },
    markModified: jest.fn(),
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
  };

  const createMockModel = () => {
    const fn = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      _id: validLessonId,
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: validLessonId,
      }),
    })) as unknown as Record<string, jest.Mock>;

    fn.find = jest.fn();
    fn.findById = jest.fn();
    fn.findOne = jest.fn();
    fn.findByIdAndDelete = jest.fn();
    fn.countDocuments = jest.fn();
    return fn;
  };

  let lessonModelMock: ReturnType<typeof createMockModel>;
  let courseModelMock: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    lessonModelMock = createMockModel();
    courseModelMock = createMockModel();

    service = new AdminLessonsService(lessonModelMock as never, courseModelMock as never);
  });

  describe('listLessons', () => {
    it('should query lessons with pagination and filters and enrich course titles', async () => {
      const execCount = jest.fn().mockResolvedValue(1);
      const execFind = jest.fn().mockResolvedValue([mockLesson]);
      const execCourseFind = jest.fn().mockResolvedValue([
        {
          _id: new Types.ObjectId(validCourseId),
          title: 'Pre-Seed Fundraising Masterclass',
          modules: [
            {
              _id: new Types.ObjectId(validModuleId),
              title: 'Module 1: The Basics',
            },
          ],
        },
      ]);

      lessonModelMock.countDocuments.mockReturnValue({ exec: execCount });
      lessonModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: execFind,
            }),
          }),
        }),
      });

      courseModelMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: execCourseFind,
          }),
        }),
      });

      const res = await service.listLessons({
        page: 1,
        limit: 10,
        courseId: validCourseId,
        type: 'video',
      });

      expect(res.data).toHaveLength(1);
      expect(res.data[0].courseTitle).toBe('Pre-Seed Fundraising Masterclass');
      expect(res.data[0].moduleTitle).toBe('Module 1: The Basics');
      expect(res.meta.total).toBe(1);
    });
  });

  describe('getLessonById', () => {
    it('should return lesson with populated course and module', async () => {
      lessonModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLesson),
      });

      courseModelMock.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(validCourseId),
              title: 'Pre-Seed Fundraising Masterclass',
              slug: 'pre-seed-fundraising-masterclass',
              modules: [
                {
                  _id: new Types.ObjectId(validModuleId),
                  title: 'Module 1: The Basics',
                },
              ],
            }),
          }),
        }),
      });

      const res = await service.getLessonById(validLessonId);
      expect(res.id).toBe(validLessonId);
      expect(res.course?.title).toBe('Pre-Seed Fundraising Masterclass');
      expect(res.module?.title).toBe('Module 1: The Basics');
    });

    it('should throw NotFoundException for invalid or missing lesson', async () => {
      await expect(service.getLessonById('invalid-id')).rejects.toThrow(NotFoundException);

      lessonModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.getLessonById(validLessonId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLesson', () => {
    it('should create lesson, link into module, and update course stats', async () => {
      courseModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCourse,
          modules: [
            {
              _id: new Types.ObjectId(validModuleId),
              title: 'Module 1',
              lessonIds: [],
            },
          ],
          save: jest.fn().mockResolvedValue(true),
        }),
      });

      lessonModelMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ durationSec: 300 }]),
        }),
      });

      const res = await service.createLesson({
        courseId: validCourseId,
        moduleId: validModuleId,
        title: 'New Video Lesson',
        type: 'video',
        durationSec: 300,
        isFreePreview: true,
      });

      expect(res).toBeDefined();
    });

    it('should throw if course or module does not exist', async () => {
      courseModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createLesson({
          courseId: validCourseId,
          moduleId: validModuleId,
          title: 'Test',
          type: 'reading',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLesson', () => {
    it('should update lesson details and duration', async () => {
      lessonModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockLesson,
          save: jest.fn().mockResolvedValue(mockLesson),
        }),
      });

      courseModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCourse,
          save: jest.fn().mockResolvedValue(true),
        }),
      });

      lessonModelMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ durationSec: 600 }]),
        }),
      });

      const updated = await service.updateLesson(validLessonId, {
        title: 'Updated Title',
        durationSec: 600,
      });

      expect(updated).toBeDefined();
    });
  });

  describe('deleteLesson', () => {
    it('should delete lesson and remove from course module', async () => {
      lessonModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLesson),
      });

      const courseToSave = {
        ...mockCourse,
        modules: [
          {
            _id: new Types.ObjectId(validModuleId),
            lessonIds: [validLessonId],
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      courseModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(courseToSave),
      });

      lessonModelMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      lessonModelMock.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      const res = await service.deleteLesson(validLessonId);
      expect(res.success).toBe(true);
      expect(courseToSave.modules[0].lessonIds).not.toContain(validLessonId);
    });
  });

  describe('getVideoAssets', () => {
    it('should return video assets for lessons with mux status and pagination', async () => {
      lessonModelMock.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      lessonModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockLesson]),
            }),
          }),
        }),
      });

      courseModelMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(validCourseId),
                title: 'Pre-Seed Fundraising Masterclass',
                modules: [
                  {
                    _id: new Types.ObjectId(validModuleId),
                    title: 'Module 1: The Basics',
                  },
                ],
              },
            ]),
          }),
        }),
      });

      const res = await service.getVideoAssets({});
      expect(res.data).toHaveLength(1);
      expect(res.data[0].assetId).toBe('mux-asset-123');
      expect(res.data[0].playbackId).toBe('mux-playback-123');
      expect(res.data[0].status).toBe('ready');
      expect(res.data[0].courseTitle).toBe('Pre-Seed Fundraising Masterclass');
    });
  });
});
