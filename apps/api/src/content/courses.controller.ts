import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CourseQueryDto } from '@sofe/shared';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Courses')
@Controller('courses')
@Public()
export class CoursesController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published courses with filters and cursor pagination' })
  @ApiResponse({ status: 200, description: 'List of published courses' })
  async listCourses(@Query() query: CourseQueryDto) {
    return this.contentService.listCourses(query);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List all course categories' })
  @ApiResponse({ status: 200, description: 'Course categories' })
  async getCategories() {
    const categories = await this.contentService.getCourseCategories();
    return { data: categories };
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published course details and curriculum outline by slug' })
  @ApiResponse({ status: 200, description: 'Course details' })
  async getCourseBySlug(@Param('slug') slug: string) {
    const course = await this.contentService.getCourseBySlug(slug);
    return { data: course };
  }
}
