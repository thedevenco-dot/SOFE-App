import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserAchievementDocument = HydratedDocument<UserAchievement>;

@Schema({ collection: 'userAchievements', timestamps: true })
export class UserAchievement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Achievement', required: true })
  achievementId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  achievementKey!: string;

  @Prop({ type: Date, default: () => new Date() })
  unlockedAt!: Date;

  @Prop({ type: Object, default: () => ({}) })
  progressSnapshot?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, unlockedAt: -1 });
