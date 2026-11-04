import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationType =
  | 'streak_reminder'
  | 'points_earned'
  | 'new_course'
  | 'new_article'
  | 'purchase_confirmed'
  | 'announcement';

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: [
      'streak_reminder',
      'points_earned',
      'new_course',
      'new_article',
      'purchase_confirmed',
      'announcement',
    ],
    index: true,
  })
  type!: NotificationType;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  title!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  body!: string;

  @Prop({ type: Object, default: () => ({}) })
  data!: {
    deepLink?: string;
    entityId?: string;
    points?: number;
    badgeUrl?: string;
    [key: string]: unknown;
  };

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  @Prop({ type: Date, default: Date.now, expires: '90d' }) // 90 days TTL per SCHEMA.md
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
