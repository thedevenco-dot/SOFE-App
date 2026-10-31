import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

describe('AdminCoursesController', () => {
  let controller: AdminCoursesController;
  let service: jest.Mocked<AdminCoursesService>;

  const mockAdmin = {
    _id: 'admin-123',
    name: 'Admin Tester',
  } as unknown as AdminUserDocument;

  beforeEach(() => {
    service = {
      listCourses: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      getCourseById: jest.fn().mockResolvedValue({ id: 'c1', title: 'Fundraising' }),
      createCourse: jest.fn().mockResolvedValue({ id: 'c1', title: 'Fundraising' }),
      updateCourse: jest.fn().mockResolvedValue({ id: 'c1', title: 'Updated' }),
      updateCurriculum: jest.fn().mockResolvedValue({ id: 'c1', modules: [] }),
      getPublishChecklist: jest.fn().mockResolvedValue({ canPublish: true, checks: [] }),
      publishCourse: jest.fn().mockResolvedValue({ id: 'c1', status: 'published' }),
      unpublishCourse: jest.fn().mockResolvedValue({ id: 'c1', status: 'draft' }),
      duplicateCourse: jest.fn().mockResolvedValue({ id: 'c2', title: 'Fundraising (Copy)' }),
      archiveCourse: jest.fn().mockResolvedValue({ id: 'c1', status: 'archived' }),
    } as unknown as jest.Mocked<AdminCoursesService>;

    controller = new AdminCoursesController(service);
  });

  it('listCourses delegates to service with query', async () => {
    const query = { status: 'published', page: 1 };
    await controller.listCourses(query);
    expect(service.listCourses).toHaveBeenCalledWith(query);
  });

  it('createCourse delegates to service with admin id', async () => {
    const dto = { title: 'New Course' };
    await controller.createCourse(dto, mockAdmin);
    expect(service.createCourse).toHaveBeenCalledWith(dto, 'admin-123');
  });

  it('getCourseById delegates to service', async () => {
    await controller.getCourseById('c1');
    expect(service.getCourseById).toHaveBeenCalledWith('c1');
  });

  it('updateCourse delegates to service', async () => {
    const dto = { title: 'Updated Title' };
    await controller.updateCourse('c1', dto, mockAdmin);
    expect(service.updateCourse).toHaveBeenCalledWith('c1', dto, 'admin-123');
  });

  it('updateCurriculum delegates to service', async () => {
    const body = { modules: [{ title: 'M1', order: 0, lessonIds: [] }] };
    await controller.updateCurriculum('c1', body, mockAdmin);
    expect(service.updateCurriculum).toHaveBeenCalledWith('c1', body.modules, 'admin-123');
  });

  it('getPublishChecklist delegates to service', async () => {
    await controller.getPublishChecklist('c1');
    expect(service.getPublishChecklist).toHaveBeenCalledWith('c1');
  });

  it('publishCourse delegates to service', async () => {
    await controller.publishCourse('c1', mockAdmin);
    expect(service.publishCourse).toHaveBeenCalledWith('c1', 'admin-123');
  });

  it('unpublishCourse delegates to service', async () => {
    await controller.unpublishCourse('c1', mockAdmin);
    expect(service.unpublishCourse).toHaveBeenCalledWith('c1', 'admin-123');
  });

  it('duplicateCourse delegates to service', async () => {
    await controller.duplicateCourse('c1', mockAdmin);
    expect(service.duplicateCourse).toHaveBeenCalledWith('c1', 'admin-123');
  });

  it('archiveCourse delegates to service', async () => {
    await controller.archiveCourse('c1', mockAdmin);
    expect(service.archiveCourse).toHaveBeenCalledWith('c1', 'admin-123');
  });
});
