import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InstructorDocument = HydratedDocument<Instructor>;

@Schema({ collection: 'instructors', timestamps: true })
export class Instructor {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  title?: string;

  @Prop()
  bio?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: [String], default: [] })
  links!: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
}

export const InstructorSchema = SchemaFactory.createForClass(Instructor);

InstructorSchema.index({ name: 1 });
