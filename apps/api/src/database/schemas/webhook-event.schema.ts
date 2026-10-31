import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type WebhookEventDocument = HydratedDocument<WebhookEvent>;

export const WEBHOOK_PROVIDERS = ['razorpay', 'revenuecat', 'mux', 'bigin'] as const;
export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];

export const WEBHOOK_STATUSES = ['received', 'processed', 'failed'] as const;
export type WebhookStatus = (typeof WEBHOOK_STATUSES)[number];

@Schema({ collection: 'webhookEvents', timestamps: true })
export class WebhookEvent {
  @Prop({
    type: String,
    required: true,
    enum: WEBHOOK_PROVIDERS,
  })
  provider!: WebhookProvider;

  @Prop({ type: String, required: true, trim: true })
  eventId!: string;

  @Prop({ type: String, required: true, trim: true })
  type!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload!: Record<string, unknown>;

  @Prop({
    type: String,
    required: true,
    enum: WEBHOOK_STATUSES,
    default: 'received',
  })
  status!: WebhookStatus;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);

// Unique compound index per provider + eventId to guarantee idempotency
WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

// TTL index to automatically purge webhook events after 180 days (15,552,000 seconds)
WebhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });
