import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { RewardsService } from './rewards.service';
import type { RedeemRewardDto } from '@sofe/shared';

interface AuthenticatedRequest {
  user: {
    _id?: { toString(): string };
    userId?: string;
  };
}

@Controller('rewards')
@Auth()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  async listRewards() {
    return this.rewardsService.listActiveRewards();
  }

  @Get('redemptions/me')
  async getMyRedemptions(@Req() req: AuthenticatedRequest) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.rewardsService.getMyRedemptions(userId);
  }

  @Post(':id/redeem')
  async redeemReward(
    @Req() req: AuthenticatedRequest,
    @Param('id') rewardId: string,
    @Body() body?: RedeemRewardDto,
    @Headers('idempotency-key') idempotencyHeader?: string,
    @Headers('x-idempotency-key') xIdempotencyHeader?: string,
  ) {
    const userId = req.user._id?.toString() || req.user.userId!;
    const idempotencyKey = body?.idempotencyKey || idempotencyHeader || xIdempotencyHeader;
    return this.rewardsService.redeemReward(userId, rewardId, idempotencyKey);
  }
}
