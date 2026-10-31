import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { USER_STATUSES, type UserStatus, VISIBILITIES, type Visibility } from '@sofe/shared';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserQuote {
  @Prop({ required: true })
  text!: string;

  @Prop()
  author?: string;

  @Prop({ required: true, enum: ['library', 'custom'] })
  source!: 'library' | 'custom';

  @Prop()
  quoteId?: string;
}

@Schema({ _id: false })
export class UserCounters {
  @Prop({ default: 0 })
  posts!: number;

  @Prop({ default: 0 })
  followers!: number;

  @Prop({ default: 0 })
  following!: number;
}

@Schema({ _id: false })
export class UserStreak {
  @Prop({ default: 0 })
  current!: number;

  @Prop({ default: 0 })
  longest!: number;

  @Prop()
  lastActiveDateKey?: string;
}

@Schema({ _id: false })
export class UserPlanPreferences {
  @Prop({ type: [String], default: ['watch_lesson', 'complete_quiz', 'reflect'] })
  enabledTaskKeys!: string[];
}

@Schema({ _id: false })
export class UserNotificationsSettings {
  @Prop({ default: true })
  streakReminder!: boolean;

  @Prop({ default: true })
  newContent!: boolean;

  @Prop({ default: true })
  social!: boolean;

  @Prop({ default: false })
  marketing!: boolean;
}

@Schema({ _id: false })
export class UserSettings {
  @Prop({ type: UserNotificationsSettings, default: () => ({}) })
  notifications!: UserNotificationsSettings;

  @Prop({ default: '09:00' })
  reminderTime!: string;

  @Prop({ type: String, enum: Object.values(VISIBILITIES), default: VISIBILITIES.PUBLIC })
  profileVisibility!: Visibility;
}

@Schema({ _id: false })
export class UserPushToken {
  @Prop({ required: true })
  token!: string;

  @Prop({ required: true, enum: ['ios', 'android'] })
  platform!: 'ios' | 'android';

  @Prop({ default: Date.now })
  lastSeenAt!: Date;
}

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  firebaseUid!: string;

  @Prop({ index: { sparse: true } })
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ index: { unique: true, sparse: true } })
  username?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  headline?: string;

  @Prop()
  bio?: string;

  @Prop({ default: 'Asia/Kolkata' })
  timezone!: string;

  @Prop({ type: [String], default: [] })
  interests!: string[];

  @Prop({ type: [String], default: [] })
  goals!: string[];

  @Prop()
  manifestationWord?: string;

  @Prop({ type: UserQuote })
  quote?: UserQuote;

  @Prop({
    type: String,
    enum: Object.values(USER_STATUSES),
    default: USER_STATUSES.ACTIVE,
  })
  status!: UserStatus;

  @Prop({ default: false })
  isVerifiedFounder!: boolean;

  @Prop()
  onboardingCompletedAt?: Date;

  @Prop({ type: UserCounters, default: () => ({}) })
  counters!: UserCounters;

  @Prop({ default: 0 })
  pointsBalance!: number;

  @Prop({ type: UserStreak, default: () => ({}) })
  streak!: UserStreak;

  @Prop({ type: UserPlanPreferences, default: () => ({}) })
  planPreferences!: UserPlanPreferences;

  @Prop({ type: UserSettings, default: () => ({}) })
  settings!: UserSettings;

  @Prop({ type: [UserPushToken], default: [] })
  pushTokens!: UserPushToken[];

  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop()
  deletionScheduledFor?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index required by SCHEMA.md
UserSchema.index({ status: 1, createdAt: -1 });
