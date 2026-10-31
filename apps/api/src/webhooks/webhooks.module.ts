import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MuxWebhookController } from './mux-webhook.controller';
import { MediaModule } from '../media/media.module';
import {
  WebhookEvent,
  WebhookEventSchema,
  Lesson,
  LessonSchema,
  Video,
  VideoSchema,
} from '../database/schemas';

@Module({
  imports: [
    MediaModule,
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
  ],
  controllers: [MuxWebhookController],
})
export class WebhooksModule {}
