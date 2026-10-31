import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { BOOK_FORMATS, type BookFormat } from '@sofe/shared';

export type BookDocument = HydratedDocument<Book>;

@Schema({ collection: 'books', timestamps: true })
export class Book {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, trim: true })
  author!: string;

  @Prop({ type: String, required: true })
  coverUrl!: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  descriptionJson?: Record<string, unknown>;

  @Prop({ type: String })
  descriptionHtml?: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(BOOK_FORMATS),
  })
  format!: BookFormat;

  @Prop({ type: String })
  fileUrl?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  summaryJson?: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: 'CourseCategory' })
  categoryId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Boolean, default: true })
  isFree!: boolean;

  @Prop({ type: Number })
  priceInr?: number;

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status!: 'draft' | 'published' | 'archived';

  @Prop({ type: Date })
  publishedAt?: Date;
}

export const BookSchema = SchemaFactory.createForClass(Book);

BookSchema.index({ status: 1, publishedAt: -1 });
