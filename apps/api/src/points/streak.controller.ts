import { Controller, Get, Query, Req } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { StreakService } from './streak.service';

interface AuthenticatedRequest {
  user: {
    _id: { toString(): string };
    userId?: string;
  };
}

@Controller('streak')
@Auth()
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get()
  async getStreak(@Req() req: AuthenticatedRequest, @Query('tz') tz?: string) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.streakService.getStreakStatus(userId, tz);
  }
}
