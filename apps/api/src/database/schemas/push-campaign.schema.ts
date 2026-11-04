import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PushCampaignDocument = HydratedDocument<PushCampaign>;

export type PushCampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

@Schema({ _id: false })
export class PushCampaignSegment {
  @Prop({
    type: String,
    required: true,
    enum: ['all', 'inactive_7_days', 'course_buyers', 'topic_followers', 'test_device'],
  })
  type!: 'all' | 'inactive_7_days' | 'course_buyers' | 'topic_followers' | 'test_device';

  @Prop({ type: String })
  topicId?: string;

  @Prop({ type: String })
  testToken?: string;
}

export const PushCampaignSegmentSchema = SchemaFactory.createForClass(PushCampaignSegment);

@Schema({ _id: false })
export class PushCampaignStats {
  @Prop({ type: Number, default: 0, min: 0 })
  targeted!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  sent!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  opened!: number;
}

export const PushCampaignStatsSchema = SchemaFactory.createForClass(PushCampaignStats);

@Schema({ collection: 'pushCampaigns', timestamps: true })
export class PushCampaign {
  @Prop({ type: String, required: true, trim: true, maxlength: 50 })
  title!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 150 })
  body!: string;

  @Prop({ type: String, trim: true })
  deepLink?: string;

  @Prop({ type: PushCampaignSegmentSchema, required: true })
  segment!: PushCampaignSegment;

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'draft',
    index: true,
  })
  status!: PushCampaignStatus;

  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: PushCampaignStatsSchema, default: () => ({ targeted: 0, sent: 0, opened: 0 }) })
  stats!: PushCampaignStats;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const PushCampaignSchema = SchemaFactory.createForClass(PushCampaign);

PushCampaignSchema.index({ status: 1, scheduledAt: 1 });
PushCampaignSchema.index({ createdAt: -1 });
