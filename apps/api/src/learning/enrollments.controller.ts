import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../common/decorators';
import { UserDocument } from '../database/schemas/user.schema';
import { LearningService } from './learning.service';

@ApiTags('Learner Enrollments')
@Controller('enrollments')
@Auth()
export class EnrollmentsController {
  constructor(private readonly learningService: LearningService) {}

  @Get()
  @ApiOperation({ summary: 'List courses the learner is enrolled in with progress' })
  @ApiResponse({ status: 200, description: 'List of active and completed enrollments' })
  async getMyEnrollments(@CurrentUser() user: UserDocument) {
    const enrollments = await this.learningService.listEnrollments(user._id.toString());
    return { data: enrollments };
  }
}
