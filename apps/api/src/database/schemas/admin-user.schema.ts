import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ADMIN_ROLES, type AdminRole, ADMIN_STATUSES, type AdminStatus } from '@sofe/shared';

export type AdminUserDocument = HydratedDocument<AdminUser>;

@Schema({
  collection: 'adminUsers',
  timestamps: true,
})
export class AdminUser {
  @Prop({ required: true, unique: true, index: true })
  firebaseUid!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({
    type: [String],
    enum: Object.values(ADMIN_ROLES),
    required: true,
    default: [],
  })
  roles!: AdminRole[];

  @Prop({
    type: String,
    enum: Object.values(ADMIN_STATUSES),
    default: ADMIN_STATUSES.ACTIVE,
  })
  status!: AdminStatus;

  @Prop({ default: false })
  twoFactorEnabled!: boolean;

  @Prop()
  totpSecretEnc?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  invitedBy?: string;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
