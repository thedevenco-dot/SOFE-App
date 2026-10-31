import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ADMIN_PERMISSIONS,
  CreateLessonDto,
  createLessonSchema,
  UpdateLessonDto,
  updateLessonSchema,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AdminLessonsService, LessonFilterQuery, VideoAssetsQuery } from './admin-lessons.service';

@ApiTags('Admin Lessons')
@Controller('admin')
@UseInterceptors(AuditLogInterceptor)
export class AdminLessonsController {
  constructor(private readonly lessonsService: AdminLessonsService) {}

  @Get('lessons')
  @AdminAuth(ADMIN_PERMISSIONS.LESSON_READ)
  @ApiOperation({ summary: 'List lessons with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated lessons list' })
  async listLessons(@Query() query: LessonFilterQuery) {
    return this.lessonsService.listLessons(query);
  }

  @Post('lessons')
  @AdminAuth(ADMIN_PERMISSIONS.LESSON_WRITE)
  @AuditAction('create', 'lesson')
  @ApiOperation({ summary: 'Create a new lesson in a course module' })
  @ApiResponse({ status: 201, description: 'Lesson created' })
  async createLesson(
    @Body(new ZodValidationPipe(createLessonSchema)) dto: CreateLessonDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.lessonsService.createLesson(dto, admin?._id?.toString());
  }

  @Get('lessons/:id')
  @AdminAuth(ADMIN_PERMISSIONS.LESSON_READ)
  @ApiOperation({ summary: 'Get lesson details by ID' })
  @ApiResponse({ status: 200, description: 'Lesson details' })
  async getLessonById(@Param('id') id: string) {
    return this.lessonsService.getLessonById(id);
  }

  @Put('lessons/:id')
  @AdminAuth(ADMIN_PERMISSIONS.LESSON_WRITE)
  @AuditAction('update', 'lesson')
  @ApiOperation({ summary: 'Update lesson details, type-specific content, or status' })
  @ApiResponse({ status: 200, description: 'Lesson updated' })
  async updateLesson(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLessonSchema)) dto: UpdateLessonDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.lessonsService.updateLesson(id, dto, admin?._id?.toString());
  }

  @Delete('lessons/:id')
  @AdminAuth(ADMIN_PERMISSIONS.LESSON_WRITE)
  @AuditAction('delete', 'lesson')
  @ApiOperation({ summary: 'Delete a lesson from its course module' })
  @ApiResponse({ status: 200, description: 'Lesson deleted' })
  async deleteLesson(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.lessonsService.deleteLesson(id, admin?._id?.toString());
  }

  @Get('media/video-assets')
  @AdminAuth(ADMIN_PERMISSIONS.LESSON_READ)
  @ApiOperation({ summary: 'List all video assets across lessons and courses' })
  @ApiResponse({ status: 200, description: 'List of video assets' })
  async getVideoAssets(@Query() query: VideoAssetsQuery) {
    return this.lessonsService.getVideoAssets(query);
  }
}
