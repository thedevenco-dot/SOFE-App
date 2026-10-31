import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourseCategoryDocument = HydratedDocument<CourseCategory>;

@Schema({ collection: 'courseCategories', timestamps: true })
export class CourseCategory {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ default: 0 })
  order!: number;

  @Prop()
  iconUrl?: string;
}

export const CourseCategorySchema = SchemaFactory.createForClass(CourseCategory);

CourseCategorySchema.index({ order: 1 });
