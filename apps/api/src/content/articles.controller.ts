import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleQueryDto } from '@sofe/shared';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Articles')
@Controller('articles')
@Public()
export class ArticlesController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published articles with topic filter and cursor pagination' })
  @ApiResponse({ status: 200, description: 'List of published articles' })
  async listArticles(@Query() query: ArticleQueryDto) {
    return this.contentService.listArticles(query);
  }

  @Get('feed')
  @Public()
  @ApiOperation({ summary: 'Get Startup World feed (featured, recent, and tabs)' })
  @ApiResponse({ status: 200, description: 'Articles feed' })
  async getFeed() {
    const feed = await this.contentService.getArticlesFeed();
    return { data: feed };
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published article details by slug' })
  @ApiResponse({ status: 200, description: 'Article details' })
  async getArticleBySlug(@Param('slug') slug: string) {
    const article = await this.contentService.getArticleBySlug(slug);
    return { data: article };
  }
}
