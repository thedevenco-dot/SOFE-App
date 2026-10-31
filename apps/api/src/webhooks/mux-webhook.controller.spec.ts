import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { MuxWebhookController } from './mux-webhook.controller';
import { MuxService } from '../media/mux.service';
import { WebhookEvent } from '../database/schemas/webhook-event.schema';
import { Lesson } from '../database/schemas/lesson.schema';
import { Video } from '../database/schemas/video.schema';

describe('MuxWebhookController', () => {
  let controller: MuxWebhookController;

  const mockMuxService = {
    verifyWebhookSignature: jest.fn(),
  };

  const mockWebhookEventModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue(true),
  })) as unknown as { findOne: jest.Mock };
  mockWebhookEventModel.findOne = jest.fn();

  const mockLessonModel = {
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockVideoModel = {
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MuxWebhookController],
      providers: [
        { provide: MuxService, useValue: mockMuxService },
        { provide: getModelToken(WebhookEvent.name), useValue: mockWebhookEventModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        { provide: getModelToken(Video.name), useValue: mockVideoModel },
      ],
    }).compile();

    controller = module.get<MuxWebhookController>(MuxWebhookController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleMuxWebhook', () => {
    const validSignature = 't=1234567,v1=valid-sig';
    const sampleReadyEvent = {
      id: 'evt-mux-ready-999',
      type: 'video.asset.ready',
      data: {
        id: 'asset-mux-100',
        playback_ids: [{ id: 'playback-ready-100' }],
        duration: 360.4,
      },
    };

    it('should throw UnauthorizedException if webhook signature is invalid', async () => {
      mockMuxService.verifyWebhookSignature.mockReturnValue(false);

      await expect(controller.handleMuxWebhook('invalid-sig', sampleReadyEvent)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle duplicate events idempotently without re-executing updates', async () => {
      mockMuxService.verifyWebhookSignature.mockReturnValue(true);
      mockWebhookEventModel.findOne.mockResolvedValue({
        eventId: 'evt-mux-ready-999',
        status: 'processed',
      });

      const result = await controller.handleMuxWebhook(validSignature, sampleReadyEvent);
      expect(result).toEqual({ received: true, duplicate: true });
      expect(mockLessonModel.updateMany).not.toHaveBeenCalled();
      expect(mockVideoModel.updateMany).not.toHaveBeenCalled();
    });

    it('should process video.asset.ready and update matching lesson and video records', async () => {
      mockMuxService.verifyWebhookSignature.mockReturnValue(true);
      mockWebhookEventModel.findOne.mockResolvedValue(null);

      const result = await controller.handleMuxWebhook(validSignature, sampleReadyEvent);
      expect(result).toEqual({ received: true });

      expect(mockLessonModel.updateMany).toHaveBeenCalledWith(
        { 'video.mux.assetId': 'asset-mux-100' },
        expect.objectContaining({
          $set: expect.objectContaining({
            'video.mux.status': 'ready',
            'video.mux.playbackId': 'playback-ready-100',
            durationSec: 360,
          }),
        }),
      );

      expect(mockVideoModel.updateMany).toHaveBeenCalledWith(
        { 'mux.assetId': 'asset-mux-100' },
        expect.objectContaining({
          $set: expect.objectContaining({
            'mux.status': 'ready',
            'mux.playbackId': 'playback-ready-100',
            durationSec: 360,
          }),
        }),
      );
    });

    it('should process video.asset.errored and mark records as errored', async () => {
      mockMuxService.verifyWebhookSignature.mockReturnValue(true);
      mockWebhookEventModel.findOne.mockResolvedValue(null);

      const errorEvent = {
        id: 'evt-mux-error-888',
        type: 'video.asset.errored',
        data: {
          id: 'asset-mux-failed',
        },
      };

      const result = await controller.handleMuxWebhook(validSignature, errorEvent);
      expect(result).toEqual({ received: true });

      expect(mockLessonModel.updateMany).toHaveBeenCalledWith(
        { 'video.mux.assetId': 'asset-mux-failed' },
        { $set: { 'video.mux.status': 'errored' } },
      );

      expect(mockVideoModel.updateMany).toHaveBeenCalledWith(
        { 'mux.assetId': 'asset-mux-failed' },
        { $set: { 'mux.status': 'errored' } },
      );
    });
  });
});
