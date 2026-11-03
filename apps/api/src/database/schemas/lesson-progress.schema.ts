import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LESSON_PROGRESS_STATUSES, type LessonProgressStatus } from '@sofe/shared';

export type LessonProgressDocument = HydratedDocument<LessonProgress>;

@Schema({ collection: 'lessonProgress', timestamps: true })
export class LessonProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(LESSON_PROGRESS_STATUSES),
    default: LESSON_PROGRESS_STATUSES.IN_PROGRESS,
  })
  status!: LessonProgressStatus;

  @Prop({ type: Number, required: true, default: 0 })
  watchedSec!: number;

  @Prop({ type: Number, required: true, default: 0 })
  percent!: number;

  @Prop({ type: Number })
  quizScore?: number;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date, required: true, default: () => new Date() })
  lastEventAt!: Date;
}

export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);

// Unique compound index: One progress entry per user per lesson
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonProgressSchema.index({ userId: 1, courseId: 1 });
