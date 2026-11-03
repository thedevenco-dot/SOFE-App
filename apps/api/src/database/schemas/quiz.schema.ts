import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  QUIZ_KINDS,
  type QuizKind,
  QUESTION_TYPES,
  type QuestionType,
  QUIZ_STATUSES,
  type QuizStatus,
} from '@sofe/shared';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({ _id: false })
export class QuizOptionEntry {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  text!: string;

  @Prop({ type: Boolean, required: true })
  isCorrect!: boolean;

  @Prop({ type: String })
  explanation?: string;
}

@Schema({ _id: false })
export class QuizQuestionEntry {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  text!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(QUESTION_TYPES),
  })
  type!: QuestionType;

  @Prop({ type: [QuizOptionEntry], required: true })
  options!: QuizOptionEntry[];

  @Prop({ type: Number, default: 10 })
  points?: number;
}

@Schema({ collection: 'quizzes', timestamps: true })
export class Quiz {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(QUIZ_KINDS),
    default: QUIZ_KINDS.QUICK_QUIZ,
  })
  kind!: QuizKind;

  @Prop({ type: Types.ObjectId, ref: 'Lesson' })
  lessonId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Topic', index: true })
  topicId?: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 80 })
  passingScorePercent!: number;

  @Prop({ type: [QuizQuestionEntry], required: true })
  questions!: QuizQuestionEntry[];

  @Prop({
    type: String,
    required: true,
    enum: Object.values(QUIZ_STATUSES),
    default: QUIZ_STATUSES.PUBLISHED,
  })
  status!: QuizStatus;

  @Prop({ type: Number, default: 0 })
  order?: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Index requirements
QuizSchema.index({ kind: 1, status: 1 });
QuizSchema.index({ lessonId: 1 }, { sparse: true });
