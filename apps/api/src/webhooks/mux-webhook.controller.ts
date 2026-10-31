import {
  Controller,
  Post,
  Headers,
  Body,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Public } from '../common/decorators';
import { MuxService } from '../media/mux.service';
import {
  WebhookEvent,
  WebhookEventDocument,
  Lesson,
  LessonDocument,
  Video,
  VideoDocument,
} from '../database/schemas';

@Controller('webhooks')
export class MuxWebhookController {
  private readonly logger = new Logger(MuxWebhookController.name);

  constructor(
    private readonly muxService: MuxService,
    @InjectModel(WebhookEvent.name) private readonly webhookEventModel: Model<WebhookEventDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Video.name) private readonly videoModel: Model<VideoDocument>,
  ) {}

  @Post('mux')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleMuxWebhook(
    @Headers('mux-signature') signature: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    const rawBody = JSON.stringify(payload);

    // 1. Cryptographic signature check
    const isValid = this.muxService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Rejected Mux webhook: invalid or missing cryptographic signature');
      throw new UnauthorizedException({
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: 'Invalid Mux webhook signature',
      });
    }

    const eventId = payload?.['id'] as string | undefined;
    const eventType = payload?.['type'] as string | undefined;

    if (!eventId || !eventType) {
      return { received: true };
    }

    // 2. Idempotency check via webhookEvents collection
    const existing = await this.webhookEventModel.findOne({
      provider: 'mux',
      eventId,
    });

    if (existing && existing.status === 'processed') {
      this.logger.log(`Ignoring duplicate Mux event ${eventId} (${eventType})`);
      return { received: true, duplicate: true };
    }

    const webhookEvent =
      existing ||
      new this.webhookEventModel({
        provider: 'mux',
        eventId,
        type: eventType,
        payload,
        status: 'received',
      });

    const eventData = payload['data'] as
      { id?: string; playback_ids?: Array<{ id: string }>; duration?: number } | undefined;

    try {
      // 3. Dispatch specific event handlers
      if (eventType === 'video.asset.ready') {
        const assetId = eventData?.id;
        const playbackId = eventData?.playback_ids?.[0]?.id;
        const durationSec = Math.round(eventData?.duration || 0);

        if (assetId) {
          // Update any lessons referencing this asset
          await this.lessonModel.updateMany(
            { 'video.mux.assetId': assetId },
            {
              $set: {
                'video.mux.status': 'ready',
                ...(playbackId && { 'video.mux.playbackId': playbackId }),
                ...(durationSec > 0 && { durationSec }),
              },
            },
          );

          // Update any standalone videos referencing this asset
          await this.videoModel.updateMany(
            { 'mux.assetId': assetId },
            {
              $set: {
                'mux.status': 'ready',
                ...(playbackId && { 'mux.playbackId': playbackId }),
                ...(durationSec > 0 && { durationSec }),
              },
            },
          );
        }
      } else if (eventType === 'video.asset.errored') {
        const assetId = eventData?.id;
        if (assetId) {
          await this.lessonModel.updateMany(
            { 'video.mux.assetId': assetId },
            { $set: { 'video.mux.status': 'errored' } },
          );
          await this.videoModel.updateMany(
            { 'mux.assetId': assetId },
            { $set: { 'mux.status': 'errored' } },
          );
        }
      }

      webhookEvent.status = 'processed';
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing Mux webhook event ${eventId}`, err);
      webhookEvent.status = 'failed';
      webhookEvent.error = errorMessage;
      await webhookEvent.save();
      throw err;
    }

    return { received: true };
  }
}
