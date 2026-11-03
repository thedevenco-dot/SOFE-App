import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../common/decorators';
import { UserDocument } from '../database/schemas/user.schema';
import { LearningService } from './learning.service';

@ApiTags('Learner Courses & Curriculum')
@Controller('courses')
@Auth()
export class LearningCoursesController {
  constructor(private readonly learningService: LearningService) {}

  @Get('continue')
  @ApiOperation({ summary: 'Get the last accessed or next unfinished lesson across enrollments' })
  @ApiResponse({ status: 200, description: 'Last unfinished lesson for resuming progress' })
  async continueLearning(@CurrentUser() user: UserDocument, @Query('courseId') courseId?: string) {
    const nextLesson = await this.learningService.getContinueLesson(user._id.toString(), courseId);
    return { data: nextLesson };
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll in a free course without checkout' })
  @ApiResponse({ status: 201, description: 'Successfully enrolled' })
  async enrollFreeCourse(@CurrentUser() user: UserDocument, @Param('id') courseIdOrSlug: string) {
    const enrollment = await this.learningService.enrollFreeCourse(
      user._id.toString(),
      courseIdOrSlug,
    );
    return { data: enrollment };
  }

  @Get(':id/curriculum')
  @ApiOperation({ summary: 'Get full course curriculum merged with learner progress' })
  @ApiResponse({ status: 200, description: 'Curriculum with module and lesson progress' })
  async getCourseCurriculum(
    @CurrentUser() user: UserDocument,
    @Param('id') courseIdOrSlug: string,
  ) {
    const curriculum = await this.learningService.getCourseCurriculum(
      user._id.toString(),
      courseIdOrSlug,
    );
    return { data: curriculum };
  }

  @Get(':id/resources')
  @ApiOperation({ summary: 'Get all downloadable resources for an enrolled course' })
  @ApiResponse({ status: 200, description: 'Course resource files and links' })
  async getCourseResources(@CurrentUser() user: UserDocument, @Param('id') courseIdOrSlug: string) {
    const resources = await this.learningService.getCourseResources(
      user._id.toString(),
      courseIdOrSlug,
    );
    return { data: resources };
  }
}
