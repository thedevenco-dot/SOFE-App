import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'auditLogs',
  timestamps: { createdAt: true, updatedAt: false },
})
export class AuditLog {
  @Prop({ required: true, index: true })
  actorAdminId!: string;

  @Prop({ required: true })
  actorEmail!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  entityType!: string;

  @Prop({ required: true })
  entityId!: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  before?: Record<string, unknown>;

  @Prop({ type: MongooseSchema.Types.Mixed })
  after?: Record<string, unknown>;

  @Prop({ required: true })
  ip!: string;

  @Prop({ required: true })
  userAgent!: string;

  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Required indexes per SCHEMA.md
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ actorAdminId: 1, createdAt: -1 });
