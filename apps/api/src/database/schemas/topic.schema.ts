import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ collection: 'topics', timestamps: true })
export class Topic {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ default: false })
  isTab!: boolean;

  @Prop()
  description?: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

TopicSchema.index({ order: 1 });
TopicSchema.index({ isTab: 1 });
