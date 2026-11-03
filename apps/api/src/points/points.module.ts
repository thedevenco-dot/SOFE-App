import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PointsLedger,
  PointsLedgerSchema,
  StreakDay,
  StreakDaySchema,
  User,
  UserSchema,
} from '../database/schemas';
import { PointsService } from './points.service';
import { StreakService } from './streak.service';
import { PointsController } from './points.controller';
import { StreakController } from './streak.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PointsLedger.name, schema: PointsLedgerSchema },
      { name: StreakDay.name, schema: StreakDaySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PointsController, StreakController],
  providers: [PointsService, StreakService],
  exports: [PointsService, StreakService],
})
export class PointsModule {}
