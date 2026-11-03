import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { QuizService } from './quiz.service';
import { submitQuizAttemptSchema, type SubmitQuizAttemptDto } from '@sofe/shared';

interface AuthenticatedRequest {
  user: {
    _id?: { toString(): string };
    userId?: string;
  };
}

@Controller('quizzes')
@Auth()
export class QuizzesController {
  constructor(private readonly quizService: QuizService) {}

  @Get(':id')
  async getPublicQuiz(@Param('id') id: string) {
    return this.quizService.getPublicQuiz(id);
  }

  @Post(':id/submit')
  async submitQuiz(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SubmitQuizAttemptDto,
    @Query('tz') tz?: string,
  ) {
    const parseResult = submitQuizAttemptSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid quiz submission format',
        errors: parseResult.error.issues,
      });
    }

    const userId = req.user._id?.toString() || req.user.userId!;
    return this.quizService.submitQuiz(userId, id, parseResult.data, tz);
  }
}
