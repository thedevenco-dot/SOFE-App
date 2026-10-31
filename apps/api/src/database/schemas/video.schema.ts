import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MUX_ASSET_STATUSES, type MuxAssetStatus } from '@sofe/shared';

export type VideoDocument = HydratedDocument<Video>;

@Schema({ _id: false })
export class VideoMuxData {
  @Prop({ type: String })
  assetId?: string;

  @Prop({ type: String })
  playbackId?: string;

  @Prop({
    type: String,
    enum: Object.values(MUX_ASSET_STATUSES),
    default: MUX_ASSET_STATUSES.READY,
  })
  status?: MuxAssetStatus;
}

@Schema({ collection: 'videos', timestamps: true })
export class Video {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String, required: true })
  thumbnailUrl!: string;

  @Prop({ type: VideoMuxData, default: () => ({}) })
  mux!: VideoMuxData;

  @Prop({ type: Number, default: 0 })
  durationSec!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Topic' }], default: [] })
  topicIds!: Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  isFree!: boolean;

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status!: 'draft' | 'published' | 'archived';

  @Prop({ type: Date })
  publishedAt?: Date;
}

export const VideoSchema = SchemaFactory.createForClass(Video);

VideoSchema.index({ status: 1, publishedAt: -1 });
