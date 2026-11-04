import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { PracticeService } from './practice.service';

interface AuthenticatedRequest {
  user: {
    _id?: { toString(): string };
    userId?: string;
  };
}

@Controller(['practise', 'practice'])
@Auth()
export class PractiseController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('today')
  async getToday(@Req() req: AuthenticatedRequest, @Query('tz') tz?: string) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.practiceService.getTodayPractice(userId, tz);
  }

  @Get('history')
  async getHistory(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    const userId = req.user._id?.toString() || req.user.userId!;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.practiceService.getPracticeHistory(userId, parsedLimit);
  }

  @Get('reflection/today')
  async getTodayReflection(@Query('tz') tz?: string) {
    return this.practiceService.getTodayReflection(tz);
  }

  @Post('reflection')
  async submitReflection(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { responseText: string; promptId?: string },
    @Query('tz') tz?: string,
  ) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.practiceService.submitReflection(userId, dto, tz);
  }

  @Get('rewards')
  async getRewards() {
    return this.practiceService.getLearnerRewards();
  }

  @Post('rewards/:id/redeem')
  async redeemReward(
    @Req() req: AuthenticatedRequest,
    @Param('id') rewardId: string,
    @Body() body?: { idempotencyKey?: string },
    @Headers('idempotency-key') idempotencyHeader?: string,
    @Headers('x-idempotency-key') xIdempotencyHeader?: string,
  ) {
    const userId = req.user._id?.toString() || req.user.userId!;
    const idempotencyKey = body?.idempotencyKey || idempotencyHeader || xIdempotencyHeader;
    return idempotencyKey
      ? this.practiceService.redeemReward(userId, rewardId, idempotencyKey)
      : this.practiceService.redeemReward(userId, rewardId);
  }
}
