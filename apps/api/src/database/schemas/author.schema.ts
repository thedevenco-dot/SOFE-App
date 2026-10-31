import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuthorDocument = HydratedDocument<Author>;

@Schema({ collection: 'authors', timestamps: true })
export class Author {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  title?: string;

  @Prop()
  bio?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);

AuthorSchema.index({ name: 1 });
