import { Body, Controller, Delete, Get, Param, Post, Put, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ADMIN_PERMISSIONS,
  AuthorDto,
  authorSchema,
  CourseCategoryDto,
  courseCategorySchema,
  InstructorDto,
  instructorSchema,
  TopicDto,
  topicSchema,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminTaxonomyService } from './admin-taxonomy.service';

@ApiTags('Admin Taxonomy')
@Controller('admin')
@UseInterceptors(AuditLogInterceptor)
export class AdminTaxonomyController {
  constructor(private readonly taxonomyService: AdminTaxonomyService) {}

  // ==========================================
  // Categories (CS8)
  // ==========================================

  @Get('course-categories')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'List all course categories' })
  @ApiResponse({ status: 200, description: 'List of course categories' })
  async listCategories() {
    return this.taxonomyService.listCategories();
  }

  @Get('course-categories/:id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'Get a course category by ID' })
  @ApiResponse({ status: 200, description: 'The course category' })
  async getCategoryById(@Param('id') id: string) {
    return this.taxonomyService.getCategoryById(id);
  }

  @Post('course-categories')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('create', 'category')
  @ApiOperation({ summary: 'Create a new course category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@Body(new ZodValidationPipe(courseCategorySchema)) dto: CourseCategoryDto) {
    return this.taxonomyService.createCategory(dto);
  }

  @Put('course-categories/:id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('update', 'category')
  @ApiOperation({ summary: 'Update a course category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(courseCategorySchema.partial()))
    dto: Partial<CourseCategoryDto>,
  ) {
    return this.taxonomyService.updateCategory(id, dto);
  }

  @Delete('course-categories/:id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('delete', 'category')
  @ApiOperation({ summary: 'Delete a course category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async deleteCategory(@Param('id') id: string) {
    return this.taxonomyService.deleteCategory(id);
  }

  // ==========================================
  // Instructors (CS9)
  // ==========================================

  @Get('instructors')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'List all instructors' })
  @ApiResponse({ status: 200, description: 'List of instructors' })
  async listInstructors() {
    return this.taxonomyService.listInstructors();
  }

  @Get('instructors/:id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'Get instructor by ID' })
  @ApiResponse({ status: 200, description: 'The instructor' })
  async getInstructorById(@Param('id') id: string) {
    return this.taxonomyService.getInstructorById(id);
  }

  @Post('instructors')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('create', 'instructor')
  @ApiOperation({ summary: 'Create an instructor' })
  @ApiResponse({ status: 201, description: 'Instructor created' })
  async createInstructor(@Body(new ZodValidationPipe(instructorSchema)) dto: InstructorDto) {
    return this.taxonomyService.createInstructor(dto);
  }

  @Put('instructors/:id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('update', 'instructor')
  @ApiOperation({ summary: 'Update an instructor' })
  @ApiResponse({ status: 200, description: 'Instructor updated' })
  async updateInstructor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(instructorSchema.partial()))
    dto: Partial<InstructorDto>,
  ) {
    return this.taxonomyService.updateInstructor(id, dto);
  }

  @Delete('instructors/:id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('delete', 'instructor')
  @ApiOperation({ summary: 'Delete an instructor' })
  @ApiResponse({ status: 200, description: 'Instructor deleted' })
  async deleteInstructor(@Param('id') id: string) {
    return this.taxonomyService.deleteInstructor(id);
  }

  // ==========================================
  // Topics (CS15)
  // ==========================================

  @Get('topics')
  @AdminAuth(ADMIN_PERMISSIONS.TOPIC_READ)
  @ApiOperation({ summary: 'List all topics' })
  @ApiResponse({ status: 200, description: 'List of topics' })
  async listTopics() {
    return this.taxonomyService.listTopics();
  }

  @Get('topics/:id')
  @AdminAuth(ADMIN_PERMISSIONS.TOPIC_READ)
  @ApiOperation({ summary: 'Get topic by ID' })
  @ApiResponse({ status: 200, description: 'The topic' })
  async getTopicById(@Param('id') id: string) {
    return this.taxonomyService.getTopicById(id);
  }

  @Post('topics')
  @AdminAuth(ADMIN_PERMISSIONS.TOPIC_WRITE)
  @AuditAction('create', 'topic')
  @ApiOperation({ summary: 'Create a topic' })
  @ApiResponse({ status: 201, description: 'Topic created' })
  async createTopic(@Body(new ZodValidationPipe(topicSchema)) dto: TopicDto) {
    return this.taxonomyService.createTopic(dto);
  }

  @Put('topics/:id')
  @AdminAuth(ADMIN_PERMISSIONS.TOPIC_WRITE)
  @AuditAction('update', 'topic')
  @ApiOperation({ summary: 'Update a topic' })
  @ApiResponse({ status: 200, description: 'Topic updated' })
  async updateTopic(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(topicSchema.partial())) dto: Partial<TopicDto>,
  ) {
    return this.taxonomyService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @AdminAuth(ADMIN_PERMISSIONS.TOPIC_WRITE)
  @AuditAction('delete', 'topic')
  @ApiOperation({ summary: 'Delete a topic' })
  @ApiResponse({ status: 200, description: 'Topic deleted' })
  async deleteTopic(@Param('id') id: string) {
    return this.taxonomyService.deleteTopic(id);
  }

  // ==========================================
  // Authors (CS16)
  // ==========================================

  @Get('authors')
  @AdminAuth(ADMIN_PERMISSIONS.AUTHOR_READ)
  @ApiOperation({ summary: 'List all authors' })
  @ApiResponse({ status: 200, description: 'List of authors' })
  async listAuthors() {
    return this.taxonomyService.listAuthors();
  }

  @Get('authors/:id')
  @AdminAuth(ADMIN_PERMISSIONS.AUTHOR_READ)
  @ApiOperation({ summary: 'Get author by ID' })
  @ApiResponse({ status: 200, description: 'The author' })
  async getAuthorById(@Param('id') id: string) {
    return this.taxonomyService.getAuthorById(id);
  }

  @Post('authors')
  @AdminAuth(ADMIN_PERMISSIONS.AUTHOR_WRITE)
  @AuditAction('create', 'author')
  @ApiOperation({ summary: 'Create an author' })
  @ApiResponse({ status: 201, description: 'Author created' })
  async createAuthor(@Body(new ZodValidationPipe(authorSchema)) dto: AuthorDto) {
    return this.taxonomyService.createAuthor(dto);
  }

  @Put('authors/:id')
  @AdminAuth(ADMIN_PERMISSIONS.AUTHOR_WRITE)
  @AuditAction('update', 'author')
  @ApiOperation({ summary: 'Update an author' })
  @ApiResponse({ status: 200, description: 'Author updated' })
  async updateAuthor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(authorSchema.partial())) dto: Partial<AuthorDto>,
  ) {
    return this.taxonomyService.updateAuthor(id, dto);
  }

  @Delete('authors/:id')
  @AdminAuth(ADMIN_PERMISSIONS.AUTHOR_WRITE)
  @AuditAction('delete', 'author')
  @ApiOperation({ summary: 'Delete an author' })
  @ApiResponse({ status: 200, description: 'Author deleted' })
  async deleteAuthor(@Param('id') id: string) {
    return this.taxonomyService.deleteAuthor(id);
  }
}
