import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { POINTS_LEDGER_REASONS, type PointsLedgerReason } from '@sofe/shared';

export type PointsLedgerDocument = HydratedDocument<PointsLedger>;

@Schema({ collection: 'pointsLedger', timestamps: { createdAt: true, updatedAt: false } })
export class PointsLedger {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount!: number; // positive earn, negative spend

  @Prop({ type: Number, required: true })
  balanceAfter!: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(POINTS_LEDGER_REASONS),
  })
  reason!: PointsLedgerReason;

  @Prop({ type: String })
  refType?: string;

  @Prop({ type: String })
  refId?: string;

  @Prop({ type: String, required: true, unique: true })
  idempotencyKey!: string;

  @Prop({ type: String })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const PointsLedgerSchema = SchemaFactory.createForClass(PointsLedger);

// Index requirements from SCHEMA.md:
// - { idempotencyKey: 1 } (unique, covered by @Prop unique: true)
// - { userId: 1, createdAt: -1 }
PointsLedgerSchema.index({ userId: 1, createdAt: -1 });
