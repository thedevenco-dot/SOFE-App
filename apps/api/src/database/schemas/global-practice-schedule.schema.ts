import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PracticeSlotEntry } from './practice-schedule.schema';

export type GlobalPracticeScheduleDocument = HydratedDocument<GlobalPracticeSchedule>;

@Schema({ collection: 'globalPracticeSchedules', timestamps: true })
export class GlobalPracticeSchedule {
  @Prop({ type: String, required: true })
  dateKey!: string; // YYYY-MM-DD

  @Prop({ type: [PracticeSlotEntry], required: true })
  slots!: PracticeSlotEntry[];
}

export const GlobalPracticeScheduleSchema = SchemaFactory.createForClass(GlobalPracticeSchedule);

GlobalPracticeScheduleSchema.index({ dateKey: 1 }, { unique: true });
