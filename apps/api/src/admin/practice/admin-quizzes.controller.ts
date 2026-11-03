import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ADMIN_PERMISSIONS,
  type CreateAdminQuizDto,
  type UpdateAdminQuizDto,
  type CsvQuizImportRow,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AdminQuizzesService, type AdminQuizListQuery } from './admin-quizzes.service';

@ApiTags('Admin Quizzes')
@Controller('admin/quizzes')
@UseInterceptors(AuditLogInterceptor)
export class AdminQuizzesController {
  constructor(private readonly quizzesService: AdminQuizzesService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_READ)
  @ApiOperation({ summary: 'List quizzes with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Quizzes list' })
  async listQuizzes(@Query() query: AdminQuizListQuery) {
    return this.quizzesService.listQuizzes(query);
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_WRITE)
  @AuditAction('create', 'quiz')
  @ApiOperation({ summary: 'Create new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  async createQuiz(@Body() dto: CreateAdminQuizDto) {
    return this.quizzesService.createQuiz(dto);
  }

  @Post('import/preview')
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_WRITE)
  @ApiOperation({ summary: 'Dry-run preview CSV rows before importing' })
  @ApiResponse({ status: 200, description: 'Dry run results' })
  async previewImport(@Body() body: { rows: CsvQuizImportRow[] }) {
    return this.quizzesService.previewCsvImport(body.rows);
  }

  @Post('import/execute')
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_WRITE)
  @AuditAction('import', 'quiz')
  @ApiOperation({ summary: 'Execute CSV rows import into quizzes' })
  @ApiResponse({ status: 201, description: 'Import executed' })
  async executeImport(@Body() body: { rows: CsvQuizImportRow[] }) {
    return this.quizzesService.executeCsvImport(body.rows);
  }

  @Get(':id')
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_READ)
  @ApiOperation({ summary: 'Get full quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz details' })
  async getQuizById(@Param('id') id: string) {
    return this.quizzesService.getQuizById(id);
  }

  @Patch(':id')
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_WRITE)
  @AuditAction('update', 'quiz')
  @ApiOperation({ summary: 'Update quiz and question bank' })
  @ApiResponse({ status: 200, description: 'Quiz updated' })
  async updateQuiz(@Param('id') id: string, @Body() dto: UpdateAdminQuizDto) {
    return this.quizzesService.updateQuiz(id, dto);
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.QUIZ_WRITE)
  @AuditAction('delete', 'quiz')
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deleted' })
  async deleteQuiz(@Param('id') id: string) {
    return this.quizzesService.deleteQuiz(id);
  }
}
