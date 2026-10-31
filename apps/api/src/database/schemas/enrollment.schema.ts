import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ENROLLMENT_SOURCES,
  ENROLLMENT_STATUSES,
  type EnrollmentSource,
  type EnrollmentStatus,
} from '@sofe/shared';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({ _id: false })
export class EnrollmentProgress {
  @Prop({ type: Number, default: 0 })
  completedLessonCount!: number;

  @Prop({ type: Number, default: 0 })
  percent!: number;

  @Prop({ type: Types.ObjectId, ref: 'Lesson' })
  lastLessonId?: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  lastAccessedAt?: Date;
}

@Schema({ collection: 'enrollments', timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ENROLLMENT_SOURCES),
    default: ENROLLMENT_SOURCES.FREE,
  })
  source!: EnrollmentSource;

  @Prop({ type: Types.ObjectId })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  redemptionId?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ENROLLMENT_STATUSES),
    default: ENROLLMENT_STATUSES.ACTIVE,
  })
  status!: EnrollmentStatus;

  @Prop({ type: EnrollmentProgress, default: () => ({}) })
  progress!: EnrollmentProgress;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop({ type: String })
  revokedReason?: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Unique compound index: One enrollment per user per course
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1, status: 1, 'progress.lastAccessedAt': -1 });
EnrollmentSchema.index({ courseId: 1 });
