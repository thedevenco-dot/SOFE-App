import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PracticeAttemptDocument = HydratedDocument<PracticeAttempt>;

@Schema({ _id: false })
export class PracticeAnswerEntry {
  @Prop({ type: String, required: true })
  questionId!: string;

  @Prop({ type: [String], required: true })
  selectedOptionIds!: string[];
}

@Schema({ collection: 'practiceAttempts', timestamps: { createdAt: true, updatedAt: false } })
export class PracticeAttempt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ type: [PracticeAnswerEntry], required: true })
  answers!: PracticeAnswerEntry[];

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  score!: number; // Percentage 0-100

  @Prop({ type: Boolean, required: true })
  passed!: boolean;

  @Prop({ type: Number, default: 0 })
  pointsAwarded!: number;

  @Prop({ type: Date, default: Date.now })
  completedAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const PracticeAttemptSchema = SchemaFactory.createForClass(PracticeAttempt);

PracticeAttemptSchema.index({ userId: 1, createdAt: -1 });
PracticeAttemptSchema.index({ userId: 1, quizId: 1, createdAt: -1 });
