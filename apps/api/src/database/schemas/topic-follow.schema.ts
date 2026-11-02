import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TopicFollowDocument = HydratedDocument<TopicFollow>;

@Schema({ collection: 'topicFollows', timestamps: true })
export class TopicFollow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true, index: true })
  topicId!: Types.ObjectId;
}

export const TopicFollowSchema = SchemaFactory.createForClass(TopicFollow);

TopicFollowSchema.index({ userId: 1, topicId: 1 }, { unique: true });
