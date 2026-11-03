import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { PointsService } from './points.service';
import type { AwardPointsDto, PointsHistoryQueryDto } from '@sofe/shared';

interface AuthenticatedRequest {
  user: {
    _id: { toString(): string };
    userId?: string;
  };
}

@Controller('points')
@Auth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  async getBalance(@Req() req: AuthenticatedRequest) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.pointsService.getPointsBalance(userId);
  }

  @Get('history')
  async getHistory(@Req() req: AuthenticatedRequest, @Query() query: PointsHistoryQueryDto) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.pointsService.getPointsHistory(userId, query);
  }

  @Post('award')
  async awardPoints(@Req() req: AuthenticatedRequest, @Body() dto: Omit<AwardPointsDto, 'userId'>) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.pointsService.awardPoints({
      ...dto,
      userId,
    });
  }
}
