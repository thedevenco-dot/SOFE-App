import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  PRACTICE_SLOT_KEYS,
  type PracticeSlotKey,
  PRACTICE_REF_TYPES,
  type PracticeRefType,
} from '@sofe/shared';

export type PracticeScheduleDocument = HydratedDocument<PracticeSchedule>;

@Schema({ _id: false })
export class PracticeSlotEntry {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(PRACTICE_SLOT_KEYS),
  })
  slotKey!: PracticeSlotKey;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PRACTICE_REF_TYPES),
  })
  refType!: PracticeRefType;

  @Prop({ type: String })
  refId?: string;

  @Prop({ type: Boolean, default: false })
  done!: boolean;

  @Prop({ type: Number })
  score?: number;
}

@Schema({ collection: 'practiceSchedule', timestamps: true })
export class PracticeSchedule {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  dateKey!: string; // YYYY-MM-DD in user's timezone

  @Prop({ type: [PracticeSlotEntry], required: true })
  slots!: PracticeSlotEntry[];

  @Prop({ type: Number, default: 0 })
  completedCount!: number;
}

export const PracticeScheduleSchema = SchemaFactory.createForClass(PracticeSchedule);

// Compound unique index from SCHEMA.md: { userId: 1, dateKey: 1 }
PracticeScheduleSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
