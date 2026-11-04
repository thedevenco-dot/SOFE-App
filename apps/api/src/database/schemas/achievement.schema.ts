import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_RULE_TYPES,
  type AchievementTier,
  type AchievementRuleType,
} from '@sofe/shared';

export type AchievementDocument = HydratedDocument<Achievement>;

@Schema({ _id: false })
export class AchievementRule {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(ACHIEVEMENT_RULE_TYPES),
  })
  type!: AchievementRuleType;

  @Prop({ type: Number, required: true, min: 1 })
  threshold!: number;
}

export const AchievementRuleSchema = SchemaFactory.createForClass(AchievementRule);

@Schema({ collection: 'achievements', timestamps: true })
export class Achievement {
  @Prop({ type: String, required: true, unique: true, trim: true })
  key!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, trim: true })
  description!: string;

  @Prop({ type: String, required: true, trim: true })
  iconUrl!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ACHIEVEMENT_TIERS),
    default: ACHIEVEMENT_TIERS.BRONZE,
  })
  tier!: AchievementTier;

  @Prop({ type: AchievementRuleSchema, required: true })
  rule!: AchievementRule;

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status!: 'active' | 'inactive';

  @Prop({ type: Number, default: 0 })
  order!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);

AchievementSchema.index({ status: 1, order: 1 });
