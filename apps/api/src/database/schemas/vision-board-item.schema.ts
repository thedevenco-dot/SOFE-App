import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VisionBoardItemDocument = HydratedDocument<VisionBoardItem>;

@Schema({ collection: 'visionBoardItems', timestamps: true })
export class VisionBoardItem {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  imageUrl!: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 120 })
  caption!: string;

  @Prop({ type: Number, required: true, default: 0 })
  order!: number;
}

export const VisionBoardItemSchema = SchemaFactory.createForClass(VisionBoardItem);

// Compound index for user items ordered by position
VisionBoardItemSchema.index({ userId: 1, order: 1 });
