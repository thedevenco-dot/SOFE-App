import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  LESSON_TYPES,
  LESSON_STATUSES,
  MUX_ASSET_STATUSES,
  RESOURCE_KINDS,
  type LessonType,
  type LessonStatus,
  type MuxAssetStatus,
  type ResourceKind,
} from '@sofe/shared';

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({ _id: false })
export class LessonMuxData {
  @Prop({ type: String })
  assetId?: string;

  @Prop({ type: String })
  playbackId?: string;

  @Prop({
    type: String,
    enum: Object.values(MUX_ASSET_STATUSES),
    default: MUX_ASSET_STATUSES.READY,
  })
  status?: MuxAssetStatus;
}

@Schema({ _id: false })
export class LessonVideoData {
  @Prop({ type: LessonMuxData })
  mux?: LessonMuxData;
}

@Schema({ _id: false })
export class LessonReadingData {
  @Prop({ type: MongooseSchema.Types.Mixed })
  bodyJson?: Record<string, unknown>;

  @Prop({ type: String })
  bodyHtml?: string;
}

@Schema({ _id: false })
export class LessonQuizData {
  @Prop({ type: Types.ObjectId, ref: 'Quiz' })
  quizId?: Types.ObjectId;
}

@Schema({ _id: false })
export class LessonResourceItem {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: String, required: true, enum: Object.values(RESOURCE_KINDS) })
  kind!: ResourceKind;
}

@Schema({ _id: false })
export class LessonResourceData {
  @Prop({ type: [LessonResourceItem], default: [] })
  resources?: LessonResourceItem[];
}

@Schema({ collection: 'lessons', timestamps: true })
export class Lesson {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  moduleId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0 })
  order!: number;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(LESSON_TYPES),
  })
  type!: LessonType;

  @Prop({ type: Boolean, default: false })
  isFreePreview!: boolean;

  @Prop({ type: Boolean, default: true })
  isRequired!: boolean;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(LESSON_STATUSES),
    default: LESSON_STATUSES.DRAFT,
  })
  status!: LessonStatus;

  @Prop({ type: Number })
  durationSec?: number;

  @Prop({ type: LessonVideoData })
  video?: LessonVideoData;

  @Prop({ type: LessonReadingData })
  reading?: LessonReadingData;

  @Prop({ type: LessonQuizData })
  quiz?: LessonQuizData;

  @Prop({ type: LessonResourceData })
  resource?: LessonResourceData;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

LessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });
LessonSchema.index({ courseId: 1, status: 1 });
