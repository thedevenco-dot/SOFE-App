import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ _id: false })
export class ProjectFile {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, trim: true })
  url!: string;

  @Prop({ type: Number, required: true, min: 0 })
  size!: number;
}

export const ProjectFileSchema = SchemaFactory.createForClass(ProjectFile);

@Schema({ collection: 'projects', timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
  summary!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'published'],
    default: 'draft',
  })
  status!: 'draft' | 'published';

  @Prop({ type: String, trim: true })
  coverUrl?: string;

  @Prop({ type: [ProjectFileSchema], default: () => [] })
  files!: ProjectFile[];

  @Prop({ type: [String], default: () => [] })
  links!: string[];

  @Prop({ type: [String], default: () => [] })
  tags!: string[];

  @Prop({
    type: String,
    required: true,
    enum: ['public', 'followers', 'private'],
    default: 'public',
  })
  visibility!: 'public' | 'followers' | 'private';

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ userId: 1, updatedAt: -1 });
ProjectSchema.index({ status: 1, visibility: 1, updatedAt: -1 });
