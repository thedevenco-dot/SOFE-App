import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReflectionPromptDocument = HydratedDocument<ReflectionPrompt>;

@Schema({ collection: 'reflectionPrompts', timestamps: true })
export class ReflectionPrompt {
  @Prop({ type: String, required: true, trim: true })
  prompt!: string;

  @Prop({ type: String, trim: true })
  category?: string;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: Number, default: 0 })
  order!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReflectionPromptSchema = SchemaFactory.createForClass(ReflectionPrompt);

ReflectionPromptSchema.index({ active: 1, order: 1 });
