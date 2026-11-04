import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { REWARD_REDEMPTION_STATUSES, type RewardRedemptionStatus } from '@sofe/shared';

export type RewardRedemptionDocument = HydratedDocument<RewardRedemption>;

@Schema({ collection: 'rewardRedemptions', timestamps: true })
export class RewardRedemption {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: true })
  rewardId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  costPoints!: number;

  @Prop({ type: Types.ObjectId, ref: 'PointsLedger', required: true })
  ledgerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Enrollment' })
  enrollmentId?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(REWARD_REDEMPTION_STATUSES),
    default: REWARD_REDEMPTION_STATUSES.COMPLETED,
  })
  status!: RewardRedemptionStatus;

  @Prop({ type: String, trim: true })
  idempotencyKey?: string;

  @Prop({ type: Object, default: () => ({}) })
  metadata?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RewardRedemptionSchema = SchemaFactory.createForClass(RewardRedemption);

RewardRedemptionSchema.index({ userId: 1, createdAt: -1 });
RewardRedemptionSchema.index({ userId: 1, rewardId: 1 });
RewardRedemptionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
