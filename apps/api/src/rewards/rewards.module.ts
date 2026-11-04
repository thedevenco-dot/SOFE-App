import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Reward,
  RewardSchema,
  RewardRedemption,
  RewardRedemptionSchema,
  Enrollment,
  EnrollmentSchema,
  User,
  UserSchema,
} from '../database/schemas';
import { PointsModule } from '../points/points.module';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
      { name: RewardRedemption.name, schema: RewardRedemptionSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PointsModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
