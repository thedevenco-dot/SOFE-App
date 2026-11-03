import { Controller, Get, Query, Req } from '@nestjs/common';
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
}
