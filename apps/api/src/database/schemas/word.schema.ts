import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WordDocument = HydratedDocument<Word>;

@Schema({ collection: 'words', timestamps: true })
export class Word {
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  word!: string;

  @Prop({ type: String, trim: true })
  meaning?: string;

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  })
  status!: 'draft' | 'published' | 'archived';

  createdAt?: Date;
  updatedAt?: Date;
}

export const WordSchema = SchemaFactory.createForClass(Word);

WordSchema.index({ status: 1 });
