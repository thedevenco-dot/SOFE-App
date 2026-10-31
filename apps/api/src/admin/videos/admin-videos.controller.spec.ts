import { Types } from 'mongoose';
import { AdminVideosController } from './admin-videos.controller';
import { AdminVideosService } from './admin-videos.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

describe('AdminVideosController', () => {
  let controller: AdminVideosController;
  let serviceMock: Record<string, jest.Mock>;

  const validId = new Types.ObjectId().toHexString();
  const validAdmin = {
    _id: new Types.ObjectId(),
    email: 'admin@sofe.org',
    roles: ['super_admin'],
  } as unknown as AdminUserDocument;

  beforeEach(() => {
    serviceMock = {
      listVideos: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getVideoById: jest.fn().mockResolvedValue({ id: validId, title: 'Sample Video' }),
      createVideo: jest.fn().mockResolvedValue({ _id: validId, title: 'New Video' }),
      updateVideo: jest.fn().mockResolvedValue({ _id: validId, title: 'Updated Video' }),
      deleteVideo: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      publishVideo: jest.fn().mockResolvedValue({ _id: validId, status: 'published' }),
      unpublishVideo: jest.fn().mockResolvedValue({ _id: validId, status: 'draft' }),
      bulkAction: jest.fn().mockResolvedValue({ success: true, modifiedCount: 1 }),
    };

    controller = new AdminVideosController(serviceMock as unknown as AdminVideosService);
  });

  it('should list videos', async () => {
    const res = await controller.listVideos({ page: 1, limit: 10 });
    expect(res).toBeDefined();
    expect(serviceMock.listVideos).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('should get video by ID', async () => {
    const res = await controller.getVideoById(validId);
    expect(res).toBeDefined();
    expect(serviceMock.getVideoById).toHaveBeenCalledWith(validId);
  });

  it('should create video', async () => {
    const dto = {
      title: 'New Video',
      thumbnailUrl: 'https://images.example.com/thumb.jpg',
    };
    const res = await controller.createVideo(dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.createVideo).toHaveBeenCalledWith(dto, validAdmin._id.toString());
  });

  it('should update video', async () => {
    const dto = { title: 'Updated Video' };
    const res = await controller.updateVideo(validId, dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.updateVideo).toHaveBeenCalledWith(validId, dto, validAdmin._id.toString());
  });

  it('should delete video', async () => {
    const res = await controller.deleteVideo(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.deleteVideo).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should publish video', async () => {
    const res = await controller.publishVideo(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.publishVideo).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should unpublish video', async () => {
    const res = await controller.unpublishVideo(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.unpublishVideo).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should perform bulk action', async () => {
    const res = await controller.bulkAction({ ids: [validId], action: 'archive' });
    expect(res).toBeDefined();
    expect(serviceMock.bulkAction).toHaveBeenCalledWith([validId], 'archive');
  });
});
