import { Types } from 'mongoose';
import { AdminLessonsController } from './admin-lessons.controller';
import { AdminLessonsService } from './admin-lessons.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

describe('AdminLessonsController', () => {
  let controller: AdminLessonsController;
  let serviceMock: jest.Mocked<Partial<AdminLessonsService>>;

  const validId = new Types.ObjectId().toHexString();
  const validAdmin = {
    _id: new Types.ObjectId(),
    name: 'Admin User',
    email: 'admin@sofe.org',
    role: 'superadmin',
  } as unknown as AdminUserDocument;

  beforeEach(() => {
    serviceMock = {
      listLessons: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      }),
      getLessonById: jest.fn().mockResolvedValue({ id: validId, title: 'Sample Lesson' } as never),
      createLesson: jest.fn().mockResolvedValue({ id: validId, title: 'Created Lesson' } as never),
      updateLesson: jest.fn().mockResolvedValue({ id: validId, title: 'Updated Lesson' } as never),
      deleteLesson: jest.fn().mockResolvedValue({ success: true, message: 'Lesson deleted' }),
      getVideoAssets: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      }),
    };

    controller = new AdminLessonsController(serviceMock as AdminLessonsService);
  });

  it('should list lessons', async () => {
    const res = await controller.listLessons({ page: 1, limit: 20 });
    expect(res).toBeDefined();
    expect(serviceMock.listLessons).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('should get lesson by id', async () => {
    const res = await controller.getLessonById(validId);
    expect(res).toBeDefined();
    expect(serviceMock.getLessonById).toHaveBeenCalledWith(validId);
  });

  it('should create lesson', async () => {
    const dto = {
      courseId: validId,
      moduleId: validId,
      title: 'Video Lesson',
      type: 'video' as const,
    };
    const res = await controller.createLesson(dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.createLesson).toHaveBeenCalledWith(dto, validAdmin._id.toString());
  });

  it('should update lesson', async () => {
    const dto = { title: 'Updated' };
    const res = await controller.updateLesson(validId, dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.updateLesson).toHaveBeenCalledWith(validId, dto, validAdmin._id.toString());
  });

  it('should delete lesson', async () => {
    const res = await controller.deleteLesson(validId, validAdmin);
    expect(res.success).toBe(true);
    expect(serviceMock.deleteLesson).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should get video assets', async () => {
    const res = await controller.getVideoAssets({ status: 'ready' });
    expect(res).toBeDefined();
    expect(serviceMock.getVideoAssets).toHaveBeenCalledWith({ status: 'ready' });
  });
});
