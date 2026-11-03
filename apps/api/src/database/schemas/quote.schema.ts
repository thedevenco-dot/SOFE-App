import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuoteDocument = HydratedDocument<Quote>;

@Schema({ collection: 'quotes', timestamps: true })
export class Quote {
  @Prop({ type: String, required: true, trim: true })
  text!: string;

  @Prop({ type: String, trim: true })
  author?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

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

export const QuoteSchema = SchemaFactory.createForClass(Quote);

QuoteSchema.index({ status: 1 });
QuoteSchema.index({ tags: 1 });
