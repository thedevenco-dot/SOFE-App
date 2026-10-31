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
  CreateArticleDto,
  createArticleSchema,
  UpdateArticleDto,
  updateArticleSchema,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AdminArticlesService, ArticleFilterQuery } from './admin-articles.service';

export interface ScheduleArticleBody {
  scheduledAt: string;
}

export interface BulkArticleBody {
  ids: string[];
  action: 'archive' | 'feature' | 'unfeature';
}

@ApiTags('Admin Articles')
@Controller('admin/articles')
@UseInterceptors(AuditLogInterceptor)
export class AdminArticlesController {
  constructor(private readonly articlesService: AdminArticlesService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_READ)
  @ApiOperation({ summary: 'List articles with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated articles list' })
  async listArticles(@Query() query: ArticleFilterQuery) {
    return this.articlesService.listArticles(query);
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_WRITE)
  @AuditAction('create', 'article')
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created' })
  async createArticle(
    @Body(new ZodValidationPipe(createArticleSchema)) dto: CreateArticleDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.articlesService.createArticle(dto, admin?._id?.toString());
  }

  @Get(':id')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_READ)
  @ApiOperation({ summary: 'Get article details by ID' })
  @ApiResponse({ status: 200, description: 'Article details' })
  async getArticleById(@Param('id') id: string) {
    return this.articlesService.getArticleById(id);
  }

  @Put(':id')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_WRITE)
  @AuditAction('update', 'article')
  @ApiOperation({ summary: 'Update article metadata and body content' })
  @ApiResponse({ status: 200, description: 'Article updated' })
  async updateArticle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateArticleSchema)) dto: UpdateArticleDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.articlesService.updateArticle(id, dto, admin?._id?.toString());
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_WRITE)
  @AuditAction('delete', 'article')
  @ApiOperation({ summary: 'Delete or archive an article' })
  @ApiResponse({ status: 200, description: 'Article deleted' })
  async deleteArticle(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.articlesService.deleteArticle(id, admin?._id?.toString());
  }

  @Post(':id/publish')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_PUBLISH)
  @AuditAction('publish', 'article')
  @ApiOperation({ summary: 'Publish an article and capture version snapshot' })
  @ApiResponse({ status: 200, description: 'Article published' })
  async publishArticle(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.articlesService.publishArticle(id, admin?._id?.toString());
  }

  @Post(':id/unpublish')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_WRITE)
  @AuditAction('unpublish', 'article')
  @ApiOperation({ summary: 'Revert article status back to draft' })
  @ApiResponse({ status: 200, description: 'Article unpublished' })
  async unpublishArticle(@Param('id') id: string) {
    return this.articlesService.unpublishArticle(id);
  }

  @Post(':id/schedule')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_PUBLISH)
  @AuditAction('schedule', 'article')
  @ApiOperation({ summary: 'Schedule an article for future publication' })
  @ApiResponse({ status: 200, description: 'Article scheduled' })
  async scheduleArticle(@Param('id') id: string, @Body() body: ScheduleArticleBody) {
    return this.articlesService.scheduleArticle(id, body.scheduledAt);
  }

  @Post(':id/feature')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_WRITE)
  @AuditAction('feature', 'article')
  @ApiOperation({ summary: 'Toggle featured flag on an article' })
  @ApiResponse({ status: 200, description: 'Featured status toggled' })
  async toggleFeatured(@Param('id') id: string) {
    return this.articlesService.toggleFeatured(id);
  }

  @Post('bulk')
  @AdminAuth(ADMIN_PERMISSIONS.ARTICLE_WRITE)
  @AuditAction('bulk', 'article')
  @ApiOperation({ summary: 'Execute bulk actions on multiple articles' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  async bulkAction(@Body() body: BulkArticleBody) {
    return this.articlesService.bulkAction(body.ids, body.action);
  }
}
