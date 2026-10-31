import { Types } from 'mongoose';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaController } from './media.controller';

describe('MediaController', () => {
  let controller: MediaController;

  const mockCloudinaryService = {
    signUpload: jest.fn().mockReturnValue({
      signature: 'test-sig',
      timestamp: 1234567890,
      apiKey: 'api-key',
      cloudName: 'cloud-name',
      folder: 'sofe/dev/avatar',
      uploadUrl: 'https://api.cloudinary.com/v1_1/cloud-name/auto/upload',
    }),
  };

  const mockMuxService = {
    createDirectUploadUrl: jest.fn().mockResolvedValue({
      uploadUrl: 'https://mux.com/upload-url',
      uploadId: 'upload-id-123',
    }),
    generatePlaybackToken: jest.fn().mockReturnValue('mock.playback.jwt.token'),
  };

  const mockLessonModel = {
    findById: jest.fn(),
  };

  const mockEnrollmentModel = {
    findOne: jest.fn(),
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    name: 'Learner Founder',
  } as unknown as Parameters<typeof controller.getLessonPlaybackToken>[1];

  beforeEach(() => {
    controller = new MediaController(
      mockCloudinaryService as unknown as ConstructorParameters<typeof MediaController>[0],
      mockMuxService as unknown as ConstructorParameters<typeof MediaController>[1],
      mockLessonModel as unknown as ConstructorParameters<typeof MediaController>[2],
      mockEnrollmentModel as unknown as ConstructorParameters<typeof MediaController>[3],
    );
    jest.clearAllMocks();
  });

  describe('signUpload', () => {
    it('should return signed payload for avatars and vision board', () => {
      const response = controller.signUpload({ purpose: 'avatar' });
      expect(response.data.signature).toBe('test-sig');
      expect(mockCloudinaryService.signUpload).toHaveBeenCalledWith('avatar');
    });
  });

  describe('createVideoUpload', () => {
    it('should return direct upload URL from Mux', async () => {
      const response = await controller.createVideoUpload({});
      expect(response.data.uploadId).toBe('upload-id-123');
      expect(mockMuxService.createDirectUploadUrl).toHaveBeenCalled();
    });
  });

  describe('getLessonPlaybackToken', () => {
    const lessonId = new Types.ObjectId().toString();
    const courseId = new Types.ObjectId();

    it('should throw NotFoundException if lesson does not exist', async () => {
      mockLessonModel.findById.mockResolvedValue(null);

      await expect(controller.getLessonPlaybackToken(lessonId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if lesson has no ready video', async () => {
      mockLessonModel.findById.mockResolvedValue({
        _id: lessonId,
        title: 'Reading Lesson',
        type: 'reading',
        video: {},
      });

      await expect(controller.getLessonPlaybackToken(lessonId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow free preview lesson even if user is not enrolled', async () => {
      mockLessonModel.findById.mockResolvedValue({
        _id: lessonId,
        courseId,
        isFreePreview: true,
        video: {
          mux: {
            playbackId: 'mux-preview-playback-123',
          },
        },
      });

      const response = await controller.getLessonPlaybackToken(lessonId, mockUser);
      expect(response.data.token).toBe('mock.playback.jwt.token');
      expect(response.data.playbackId).toBe('mux-preview-playback-123');
      expect(mockEnrollmentModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException (ENROLLMENT_REQUIRED) if non-preview lesson and user not enrolled', async () => {
      mockLessonModel.findById.mockResolvedValue({
        _id: lessonId,
        courseId,
        isFreePreview: false,
        video: {
          mux: {
            playbackId: 'mux-paid-playback-456',
          },
        },
      });
      mockEnrollmentModel.findOne.mockResolvedValue(null);

      await expect(controller.getLessonPlaybackToken(lessonId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow paid lesson when user has active enrollment', async () => {
      mockLessonModel.findById.mockResolvedValue({
        _id: lessonId,
        courseId,
        isFreePreview: false,
        video: {
          mux: {
            playbackId: 'mux-paid-playback-456',
          },
        },
      });
      mockEnrollmentModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: mockUser._id,
        courseId,
        status: 'active',
      });

      const response = await controller.getLessonPlaybackToken(lessonId, mockUser);
      expect(response.data.token).toBe('mock.playback.jwt.token');
      expect(response.data.playbackId).toBe('mux-paid-playback-456');
    });
  });
});
