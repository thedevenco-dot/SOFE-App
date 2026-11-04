import { Controller, Get, Post, Req } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { AchievementsService } from './achievements.service';

interface AuthenticatedRequest {
  user: {
    _id?: { toString(): string };
    userId?: string;
  };
}

@Controller('achievements')
@Auth()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAchievements(@Req() req: AuthenticatedRequest) {
    const userId = req.user._id?.toString() || req.user.userId!;
    return this.achievementsService.listLearnerAchievements(userId);
  }

  @Post('check')
  async checkAchievements(@Req() req: AuthenticatedRequest) {
    const userId = req.user._id?.toString() || req.user.userId!;
    const newlyUnlocked = await this.achievementsService.checkAndUnlock(userId);
    return {
      success: true,
      newlyUnlockedCount: newlyUnlocked.length,
      newlyUnlocked: newlyUnlocked.map((ach) => ({
        id: ach._id.toString(),
        key: ach.key,
        title: ach.title,
        tier: ach.tier,
        iconUrl: ach.iconUrl,
      })),
    };
  }
}
