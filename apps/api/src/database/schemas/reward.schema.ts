import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { REWARD_TYPES, type RewardType } from '@sofe/shared';

export type RewardDocument = HydratedDocument<Reward>;

@Schema({ collection: 'rewards', timestamps: true })
export class Reward {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, trim: true })
  description!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(REWARD_TYPES),
  })
  type!: RewardType;

  @Prop({ type: Number, required: true, min: 1 })
  costPoints!: number;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  couponCode?: string;

  @Prop({ type: Number, default: null })
  stock?: number | null; // null means unlimited

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status!: 'active' | 'inactive';

  createdAt?: Date;
  updatedAt?: Date;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

RewardSchema.index({ status: 1, costPoints: 1 });
RewardSchema.index({ type: 1, status: 1 });
