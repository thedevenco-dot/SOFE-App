import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ContentVersionDocument = HydratedDocument<ContentVersion>;

@Schema({ collection: 'contentVersions', timestamps: true })
export class ContentVersion {
  @Prop({ type: String, required: true, trim: true })
  entityType!: string; // 'course' | 'lesson' | 'article'

  @Prop({ type: Types.ObjectId, required: true })
  entityId!: Types.ObjectId;

  @Prop({ type: Number, required: true })
  version!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  snapshot!: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  byAdminId?: Types.ObjectId;
}

export const ContentVersionSchema = SchemaFactory.createForClass(ContentVersion);

ContentVersionSchema.index({ entityType: 1, entityId: 1, version: -1 });

