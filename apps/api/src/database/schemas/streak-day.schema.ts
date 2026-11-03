import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StreakDayDocument = HydratedDocument<StreakDay>;

@Schema({ collection: 'streakDays', timestamps: { createdAt: true, updatedAt: false } })
export class StreakDay {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  dateKey!: string; // YYYY-MM-DD in user's timezone

  @Prop({ type: Number, required: true, default: 1 })
  activityCount!: number;

  @Prop({ type: Number, default: 0 })
  completedTasksCount!: number;

  @Prop({ type: Number, default: 0 })
  pointsEarned!: number;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const StreakDaySchema = SchemaFactory.createForClass(StreakDay);

// Compound Unique Index requirement from SCHEMA.md:
// - { userId: 1, dateKey: 1 } (unique compound)
StreakDaySchema.index({ userId: 1, dateKey: 1 }, { unique: true });
