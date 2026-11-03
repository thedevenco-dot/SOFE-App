import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyPlanDocument = HydratedDocument<DailyPlan>;

@Schema({ _id: false })
export class DailyPlanItemEntry {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['watch_lesson', 'complete_quiz', 'read_article', 'work_project', 'reflect'],
  })
  key!: 'watch_lesson' | 'complete_quiz' | 'read_article' | 'work_project' | 'reflect';

  @Prop({ type: String, required: true, trim: true })
  label!: string;

  @Prop({ type: Boolean, default: false })
  done!: boolean;

  @Prop({ type: Date })
  doneAt?: Date;

  @Prop({ type: String })
  refId?: string;
}

export const DailyPlanItemEntrySchema = SchemaFactory.createForClass(DailyPlanItemEntry);

@Schema({ collection: 'dailyPlans', timestamps: true })
export class DailyPlan {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  })
  dateKey!: string;

  @Prop({ type: [DailyPlanItemEntrySchema], default: [] })
  items!: DailyPlanItemEntry[];

  @Prop({ type: Number, default: 0, min: 0 })
  completedCount!: number;
}

export const DailyPlanSchema = SchemaFactory.createForClass(DailyPlan);

// Unique Compound Index: exactly 1 daily plan per user per dateKey
DailyPlanSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
