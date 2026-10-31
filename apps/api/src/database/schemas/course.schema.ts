import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { COURSE_LEVELS, COURSE_STATUSES, type CourseLevel, type CourseStatus } from '@sofe/shared';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ _id: true })
export class CourseModule {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: Number, required: true, default: 0 })
  order!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }], default: [] })
  lessonIds!: Types.ObjectId[];
}

@Schema({ _id: false })
export class CourseStats {
  @Prop({ type: Number, default: 0 })
  enrolledCount!: number;

  @Prop({ type: Number, default: 0 })
  ratingAvg!: number;

  @Prop({ type: Number, default: 0 })
  ratingCount!: number;

  @Prop({ type: Number, default: 0 })
  lessonCount!: number;

  @Prop({ type: Number, default: 0 })
  durationSec!: number;
}

@Schema({ _id: false })
export class CourseIapProductIds {
  @Prop({ type: String })
  ios?: string;

  @Prop({ type: String })
  android?: string;
}

@Schema({ _id: false })
export class CourseSeo {
  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  description?: string;
}

@Schema({ collection: 'courses', timestamps: true })
export class Course {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String })
  subtitle?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  descriptionJson?: Record<string, unknown>;

  @Prop({ type: String })
  descriptionHtml?: string;

  @Prop({ type: String, required: true })
  thumbnailUrl!: string;

  @Prop({ type: String })
  previewMuxPlaybackId?: string;

  @Prop({ type: Types.ObjectId, ref: 'CourseCategory', required: true })
  categoryId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({
    type: String,
    required: true,
    enum: Object.values(COURSE_LEVELS),
    default: COURSE_LEVELS.BEGINNER,
  })
  level!: CourseLevel;

  @Prop({ type: String, default: 'en' })
  language!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Instructor' }], default: [] })
  instructorIds!: Types.ObjectId[];

  @Prop({ type: Number, required: true, default: 0 })
  priceInr!: number;

  @Prop({ type: Number })
  compareAtPriceInr?: number;

  @Prop({ type: CourseIapProductIds, default: () => ({}) })
  iapProductIds!: CourseIapProductIds;

  @Prop({ type: Boolean, default: false })
  redeemableWithPoints!: boolean;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(COURSE_STATUSES),
    default: COURSE_STATUSES.DRAFT,
  })
  status!: CourseStatus;

  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: [CourseModule], default: [] })
  modules!: CourseModule[];

  @Prop({ type: CourseStats, default: () => ({}) })
  stats!: CourseStats;

  @Prop({ type: CourseSeo })
  seo?: CourseSeo;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  version!: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({ status: 1, publishedAt: -1 });
CourseSchema.index({ categoryId: 1, status: 1 });
CourseSchema.index({ tags: 1 });
