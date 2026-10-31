import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ARTICLE_STATUSES, type ArticleStatus } from '@sofe/shared';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ _id: false })
export class ArticleStats {
  @Prop({ type: Number, default: 0 })
  views!: number;

  @Prop({ type: Number, default: 0 })
  bookmarks!: number;
}

@Schema({ _id: false })
export class ArticleSeo {
  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  description?: string;
}

@Schema({ collection: 'articles', timestamps: true })
export class Article {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true })
  excerpt!: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  bodyJson?: Record<string, unknown>;

  @Prop({ type: String, required: true })
  bodyHtml!: string;

  @Prop({ type: String, required: true })
  coverUrl!: string;

  @Prop({ type: String })
  coverAlt?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Topic' }], default: [] })
  topicIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  primaryTopicId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  authorId!: Types.ObjectId;

  @Prop({ type: Number, default: 5 })
  readTimeMin!: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ARTICLE_STATUSES),
    default: ARTICLE_STATUSES.DRAFT,
  })
  status!: ArticleStatus;

  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: Boolean, default: false })
  featured!: boolean;

  @Prop({ type: ArticleSeo })
  seo?: ArticleSeo;

  @Prop({ type: ArticleStats, default: () => ({}) })
  stats!: ArticleStats;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  version!: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, primaryTopicId: 1, publishedAt: -1 });
ArticleSchema.index({ featured: 1, publishedAt: -1 });
