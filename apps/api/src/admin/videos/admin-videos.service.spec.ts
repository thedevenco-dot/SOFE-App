import { Types } from 'mongoose';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminVideosService, slugify } from './admin-videos.service';

describe('AdminVideosService', () => {
  let service: AdminVideosService;

  const validVideoId = new Types.ObjectId().toHexString();
  const validTopicId = new Types.ObjectId().toHexString();

  const mockVideo = {
    _id: validVideoId,
    title: 'Pitching Your Startup to Sequoia',
    slug: 'pitching-your-startup-to-sequoia',
    description: 'Frameworks and pitch deck structures.',
    thumbnailUrl: 'https://images.example.com/pitch.jpg',
    mux: {
      assetId: 'mux-asset-123',
      playbackId: 'mux-playback-456',
      status: 'ready',
    },
    durationSec: 1420,
    topicIds: [new Types.ObjectId(validTopicId)],
    isFree: true,
    status: 'draft',
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockReturnValue({
      _id: validVideoId,
      title: 'Pitching Your Startup to Sequoia',
      slug: 'pitching-your-startup-to-sequoia',
      status: 'draft',
    }),
  };

  const createMockModel = () => {
    const fn = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      _id: validVideoId,
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: validVideoId,
      }),
    })) as unknown as Record<string, jest.Mock>;

    fn.find = jest.fn();
    fn.findById = jest.fn();
    fn.findOne = jest.fn();
    fn.findByIdAndDelete = jest.fn();
    fn.countDocuments = jest.fn();
    fn.updateMany = jest.fn();
    fn.deleteMany = jest.fn();
    return fn;
  };

  let videoModelMock: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    videoModelMock = createMockModel();
    service = new AdminVideosService(videoModelMock as never);
  });

  describe('slugify', () => {
    it('should format title into lowercase slug', () => {
      expect(slugify('How to Hire Your First 10 Engineers!')).toBe(
        'how-to-hire-your-first-10-engineers',
      );
    });
  });

  describe('listVideos', () => {
    it('should query standalone videos with filters and pagination', async () => {
      const execMock = jest.fn().mockResolvedValue([mockVideo]);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

      videoModelMock.find.mockReturnValue({ populate: populateMock });
      videoModelMock.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const res = await service.listVideos({
        page: 1,
        limit: 10,
        status: 'published',
        topicId: validTopicId,
        isFree: true,
        search: 'Pitching',
      });

      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
      expect(videoModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          isFree: true,
        }),
      );
    });
  });

  describe('getVideoById', () => {
    it('should return video if found', async () => {
      videoModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockVideo),
        }),
      });

      const res = await service.getVideoById(validVideoId);
      expect(res.id).toBe(validVideoId);
      expect(res.title).toBe('Pitching Your Startup to Sequoia');
    });

    it('should throw NotFoundException on non-existent video', async () => {
      videoModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getVideoById(validVideoId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createVideo', () => {
    it('should create video with Mux data and unique slug', async () => {
      videoModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const created = await service.createVideo({
        title: 'Building Capital Efficiency',
        thumbnailUrl: 'https://images.example.com/thumb.jpg',
        mux: { assetId: 'a1', playbackId: 'p1', status: 'ready' },
        durationSec: 600,
        topicIds: [validTopicId],
      });

      expect(created).toBeDefined();
    });

    it('should throw ConflictException on slug collision', async () => {
      videoModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVideo),
      });

      await expect(
        service.createVideo({
          title: 'Pitching Your Startup to Sequoia',
          thumbnailUrl: 'https://images.example.com/pitch.jpg',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if title is empty', async () => {
      await expect(
        service.createVideo({
          title: '',
          thumbnailUrl: 'https://images.example.com/pitch.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVideo', () => {
    it('should update video fields', async () => {
      videoModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockVideo,
          save: jest.fn().mockResolvedValue(mockVideo),
        }),
      });

      const updated = await service.updateVideo(validVideoId, {
        title: 'Updated Title',
        durationSec: 1800,
      });

      expect(updated).toBeDefined();
    });
  });

  describe('deleteVideo', () => {
    it('should delete video', async () => {
      videoModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVideo),
      });
      videoModelMock.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVideo),
      });

      const res = await service.deleteVideo(validVideoId);
      expect(res.success).toBe(true);
    });
  });

  describe('publishVideo and unpublishVideo', () => {
    it('should set status to published and record publishedAt', async () => {
      const videoInstance = {
        ...mockVideo,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      videoModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(videoInstance),
      });

      const published = await service.publishVideo(validVideoId);
      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeDefined();
    });

    it('should revert status to draft on unpublish', async () => {
      const videoInstance = {
        ...mockVideo,
        status: 'published',
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      videoModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(videoInstance),
      });

      const draft = await service.unpublishVideo(validVideoId);
      expect(draft.status).toBe('draft');
    });
  });

  describe('bulkAction', () => {
    it('should archive selected videos', async () => {
      videoModelMock.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 4 }),
      });

      const res = await service.bulkAction([validVideoId], 'archive');
      expect(res.modifiedCount).toBe(4);
    });

    it('should delete selected videos', async () => {
      videoModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 2 }),
      });

      const res = await service.bulkAction([validVideoId], 'delete');
      expect(res.modifiedCount).toBe(2);
    });
  });
});
