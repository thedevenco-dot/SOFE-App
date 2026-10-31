import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({
  collection: 'appConfig',
  timestamps: true,
})
export class AppConfig {
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value!: unknown;

  @Prop({ type: MongooseSchema.Types.Mixed })
  updatedBy?: string;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
