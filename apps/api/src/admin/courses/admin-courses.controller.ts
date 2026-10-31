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
  CourseDto,
  courseSchema,
  CourseModuleDto,
  updateCurriculumSchema,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AdminCoursesService, CourseFilterQuery } from './admin-courses.service';

@ApiTags('Admin Courses')
@Controller('admin/courses')
@UseInterceptors(AuditLogInterceptor)
export class AdminCoursesController {
  constructor(private readonly coursesService: AdminCoursesService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'List courses with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated courses list' })
  async listCourses(@Query() query: CourseFilterQuery) {
    return this.coursesService.listCourses(query);
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('create', 'course')
  @ApiOperation({ summary: 'Create a new course in draft status' })
  @ApiResponse({ status: 201, description: 'Course created' })
  async createCourse(
    @Body(new ZodValidationPipe(courseSchema.partial())) dto: Partial<CourseDto>,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.coursesService.createCourse(dto, admin?._id?.toString());
  }

  @Get(':id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'Get course details by ID' })
  @ApiResponse({ status: 200, description: 'Course details' })
  async getCourseById(@Param('id') id: string) {
    return this.coursesService.getCourseById(id);
  }

  @Put(':id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('update', 'course')
  @ApiOperation({ summary: 'Update course metadata and pricing' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  async updateCourse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(courseSchema.partial())) dto: Partial<CourseDto>,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.coursesService.updateCourse(id, dto, admin?._id?.toString());
  }

  @Put(':id/curriculum')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('update_curriculum', 'course')
  @ApiOperation({ summary: 'Update course curriculum modules and lesson order' })
  @ApiResponse({ status: 200, description: 'Curriculum updated' })
  async updateCurriculum(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCurriculumSchema))
    body: { modules: CourseModuleDto[] },
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.coursesService.updateCurriculum(id, body.modules, admin?._id?.toString());
  }

  @Get(':id/publish-checklist')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'Check course readiness against the 8-point publish checklist' })
  @ApiResponse({ status: 200, description: 'Checklist validation results' })
  async getPublishChecklist(@Param('id') id: string) {
    return this.coursesService.getPublishChecklist(id);
  }

  @Post(':id/publish')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_PUBLISH)
  @AuditAction('publish', 'course')
  @ApiOperation({ summary: 'Publish course after passing the checklist' })
  @ApiResponse({ status: 200, description: 'Course published with version snapshot' })
  async publishCourse(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.coursesService.publishCourse(id, admin?._id?.toString());
  }

  @Post(':id/unpublish')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_PUBLISH)
  @AuditAction('unpublish', 'course')
  @ApiOperation({ summary: 'Revert course from published back to draft' })
  @ApiResponse({ status: 200, description: 'Course moved to draft' })
  async unpublishCourse(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.coursesService.unpublishCourse(id, admin?._id?.toString());
  }

  @Post(':id/duplicate')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('duplicate', 'course')
  @ApiOperation({ summary: 'Duplicate an existing course as draft copy' })
  @ApiResponse({ status: 201, description: 'Cloned draft course' })
  async duplicateCourse(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.coursesService.duplicateCourse(id, admin?._id?.toString());
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('archive', 'course')
  @ApiOperation({ summary: 'Archive a course' })
  @ApiResponse({ status: 200, description: 'Course archived' })
  async archiveCourse(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.coursesService.archiveCourse(id, admin?._id?.toString());
  }
}
