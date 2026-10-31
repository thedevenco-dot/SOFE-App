import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema, Video, VideoSchema } from '../../database/schemas';
import { AdminModule } from '../admin.module';
import { AdminVideosController } from './admin-videos.controller';
import { AdminVideosService } from './admin-videos.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: Topic.name, schema: TopicSchema },
    ]),
    AdminModule,
  ],
  controllers: [AdminVideosController],
  providers: [AdminVideosService],
  exports: [AdminVideosService],
})
export class AdminVideosModule {}
