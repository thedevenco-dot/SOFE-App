import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BOOKMARK_TARGET_TYPES, type BookmarkTargetType } from '@sofe/shared';

export type BookmarkDocument = HydratedDocument<Bookmark>;

@Schema({ collection: 'bookmarks', timestamps: true })
export class Bookmark {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(BOOKMARK_TARGET_TYPES),
  })
  targetType!: BookmarkTargetType;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  targetId!: Types.ObjectId;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

BookmarkSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, createdAt: -1 });
