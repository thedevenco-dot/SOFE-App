import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { lessonProgressUpdateSchema } from '@sofe/shared';
import { Auth, CurrentUser } from '../common/decorators';
import { UserDocument } from '../database/schemas/user.schema';
import { LearningService } from './learning.service';

const quizSubmitSchema = z.object({
  score: z.number().min(0).max(100),
});

@ApiTags('Learner Lessons')
@Controller('lessons')
@Auth()
export class LessonsController {
  constructor(private readonly learningService: LearningService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get lesson content and learner progress (requires enrollment or free preview)',
  })
  @ApiResponse({ status: 200, description: 'Lesson content and progress' })
  @ApiResponse({ status: 403, description: 'ENROLLMENT_REQUIRED' })
  async getLesson(@CurrentUser() user: UserDocument, @Param('id') lessonId: string) {
    const data = await this.learningService.getLesson(user._id.toString(), lessonId);
    return { data };
  }

  @Post(':id/playback-token')
  @ApiOperation({ summary: 'Generate a signed Mux playback token for a video lesson' })
  @ApiResponse({ status: 200, description: 'Signed playback token' })
  @ApiResponse({ status: 403, description: 'ENROLLMENT_REQUIRED' })
  async getPlaybackToken(@CurrentUser() user: UserDocument, @Param('id') lessonId: string) {
    const data = await this.learningService.getPlaybackToken(user._id.toString(), lessonId);
    return { data };
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Track lesson progress, update watched seconds and completion' })
  @ApiResponse({ status: 200, description: 'Updated progress and course completion status' })
  async updateProgress(
    @CurrentUser() user: UserDocument,
    @Param('id') lessonId: string,
    @Body() body: unknown,
  ) {
    const parsed = lessonProgressUpdateSchema.parse(body);
    const data = await this.learningService.updateProgress(user._id.toString(), lessonId, parsed);
    return { data };
  }

  @Post(':id/quiz/submit')
  @ApiOperation({ summary: 'Submit quiz score for quiz lesson' })
  @ApiResponse({ status: 200, description: 'Graded quiz attempt' })
  async submitQuiz(
    @CurrentUser() user: UserDocument,
    @Param('id') lessonId: string,
    @Body() body: unknown,
  ) {
    const parsed = quizSubmitSchema.parse(body);
    const data = await this.learningService.submitLessonQuiz(
      user._id.toString(),
      lessonId,
      parsed.score,
    );
    return { data };
  }
}
