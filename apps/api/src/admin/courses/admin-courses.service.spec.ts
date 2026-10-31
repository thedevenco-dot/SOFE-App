import { Types } from 'mongoose';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service';

describe('AdminCoursesService', () => {
  let service: AdminCoursesService;

  const validId = new Types.ObjectId().toHexString();
  const validAdminId = new Types.ObjectId().toHexString();
  const validCategoryId = new Types.ObjectId().toHexString();
  const validInstructorId = new Types.ObjectId().toHexString();

  const mockCourse = {
    _id: validId,
    title: 'Pre-Seed Fundraising Masterclass',
    slug: 'pre-seed-fundraising-masterclass',
    descriptionHtml: 'A'.repeat(120),
    thumbnailUrl: 'https://example.com/thumb.jpg',
    categoryId: validCategoryId,
    instructorIds: [validInstructorId],
    priceInr: 0,
    redeemableWithPoints: true,
    status: 'draft',
    version: 1,
    modules: [
      {
        _id: new Types.ObjectId(),
        title: 'Module 1',
        order: 0,
        lessonIds: [new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()],
      },
    ],
    stats: {
      lessonCount: 3,
      durationSec: 1800,
    },
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: validId,
      title: 'Pre-Seed Fundraising Masterclass',
      slug: 'pre-seed-fundraising-masterclass',
      modules: [],
    }),
  };

  type MockModel = {
    (dto: Record<string, unknown>): {
      _id: string;
      save: jest.Mock;
    };
    find: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    countDocuments: jest.Mock;
  };

  const createMockModel = (): MockModel => {
    const fn = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      _id: validId,
      save: jest.fn().mockResolvedValue({ _id: validId, ...dto }),
    })) as unknown as MockModel;

    fn.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockCourse]),
    });
    fn.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ ...mockCourse }),
    });
    fn.findOne = jest.fn().mockResolvedValue(null);
    fn.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ ...mockCourse, title: 'Updated' }),
    });
    fn.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });
    return fn;
  };

  let mockCourseModel: MockModel;
  let mockLessonModel: MockModel;
  let mockContentVersionModel: MockModel;

  beforeEach(() => {
    mockCourseModel = createMockModel();
    mockLessonModel = createMockModel();
    mockContentVersionModel = createMockModel();

    service = new AdminCoursesService(
      mockCourseModel as unknown as ConstructorParameters<typeof AdminCoursesService>[0],
      mockLessonModel as unknown as ConstructorParameters<typeof AdminCoursesService>[1],
      mockContentVersionModel as unknown as ConstructorParameters<typeof AdminCoursesService>[2],
    );
  });

  describe('listCourses', () => {
    it('returns paginated courses with filters', async () => {
      const result = await service.listCourses({
        page: 1,
        limit: 10,
        status: 'published',
        priceType: 'free',
        search: 'fundraising',
      });

      expect(mockCourseModel.find).toHaveBeenCalled();
      expect(result.items).toBeDefined();
      expect(result.total).toBe(1);
    });
  });

  describe('getCourseById', () => {
    it('returns course when id is valid', async () => {
      const result = await service.getCourseById(validId);
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validId);
      expect(result).toBeDefined();
    });

    it('throws NotFoundException on invalid id', async () => {
      await expect(service.getCourseById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCourse', () => {
    it('creates a new draft course with auto-slug', async () => {
      const result = await service.createCourse({ title: 'New Course' }, validAdminId);
      expect(result).toBeDefined();
    });

    it('throws ConflictException on duplicate slug', async () => {
      mockCourseModel.findOne.mockResolvedValueOnce({ _id: 'other', slug: 'existing-slug' });
      await expect(
        service.createCourse({ title: 'Existing Course', slug: 'existing-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateCourse', () => {
    it('updates course details', async () => {
      const result = await service.updateCourse(validId, { title: 'Updated Title' });
      expect(mockCourseModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws ConflictException if new slug conflicts with another course', async () => {
      mockCourseModel.findOne.mockResolvedValueOnce({
        _id: 'another-course',
        slug: 'conflict-slug',
      });
      await expect(service.updateCourse(validId, { slug: 'conflict-slug' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateCurriculum', () => {
    it('updates modules and recalculates duration & count', async () => {
      const mockCourseInstance = {
        ...mockCourse,
        stats: { lessonCount: 0, durationSec: 0 },
        save: jest.fn().mockResolvedValue({ _id: validId }),
      };
      mockCourseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockCourseInstance),
      });
      mockLessonModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { _id: new Types.ObjectId(), durationSec: 300 },
            { _id: new Types.ObjectId(), durationSec: 600 },
          ]),
        }),
      });

      const modules = [
        {
          title: 'Module 1',
          order: 0,
          lessonIds: [new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString()],
        },
      ];

      const res = await service.updateCurriculum(validId, modules, validAdminId);
      expect(res).toBeDefined();
      expect(mockCourseInstance.stats.lessonCount).toBe(2);
      expect(mockCourseInstance.stats.durationSec).toBe(900);
    });
  });

  describe('Publish Checklist and Publishing', () => {
    it('evaluates passing checklist when all 8 requirements are met', async () => {
      const mockCourseInstance = {
        ...mockCourse,
      };
      mockCourseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockCourseInstance),
      });

      mockLessonModel.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          { _id: 'l1', status: 'published', type: 'video', video: { mux: { status: 'ready' } } },
          { _id: 'l2', status: 'published', type: 'video', video: { mux: { status: 'ready' } } },
          { _id: 'l3', status: 'published', type: 'reading' },
        ]),
      });

      const checklist = await service.getPublishChecklist(validId);
      expect(checklist.canPublish).toBe(true);
      expect(checklist.checks.length).toBe(8);
    });

    it('publishCourse increments version and saves snapshot in contentVersions', async () => {
      const mockCourseInstance = {
        ...mockCourse,
        version: 1,
        status: 'draft',
        save: jest.fn().mockResolvedValue({ status: 'published', version: 2 }),
      };

      // Mock checklist check inside publishCourse
      jest.spyOn(service, 'getPublishChecklist').mockResolvedValueOnce({
        canPublish: true,
        checks: [],
      });

      mockCourseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockCourseInstance),
      });

      const published = await service.publishCourse(validId, validAdminId);
      expect(mockCourseInstance.status).toBe('published');
      expect(mockCourseInstance.version).toBe(2);
      expect(mockContentVersionModel).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'course',
          version: 2,
        }),
      );
      expect(published).toBeDefined();
    });

    it('publishCourse throws BadRequestException if checklist fails', async () => {
      jest.spyOn(service, 'getPublishChecklist').mockResolvedValueOnce({
        canPublish: false,
        checks: [{ key: 'curriculum', label: 'Curriculum', passed: false }],
      });

      await expect(service.publishCourse(validId, validAdminId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('unpublish, duplicate, archive', () => {
    it('unpublishCourse reverts status to draft', async () => {
      const mockCourseInstance = {
        ...mockCourse,
        status: 'published',
        save: jest.fn().mockResolvedValue({ status: 'draft' }),
      };
      mockCourseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockCourseInstance),
      });

      const res = await service.unpublishCourse(validId, validAdminId);
      expect(mockCourseInstance.status).toBe('draft');
      expect(res).toBeDefined();
    });

    it('duplicateCourse creates a cloned draft course', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          ...mockCourse,
          toObject: () => ({ ...mockCourse }),
        }),
      });

      const res = await service.duplicateCourse(validId, validAdminId);
      expect(mockCourseModel).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('(Copy)'),
          status: 'draft',
        }),
      );
      expect(res).toBeDefined();
    });

    it('archiveCourse sets status to archived', async () => {
      const mockCourseInstance = {
        ...mockCourse,
        status: 'published',
        save: jest.fn().mockResolvedValue({ status: 'archived' }),
      };
      mockCourseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockCourseInstance),
      });

      const res = await service.archiveCourse(validId, validAdminId);
      expect(mockCourseInstance.status).toBe('archived');
      expect(res).toBeDefined();
    });
  });
});
