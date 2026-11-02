import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchQueryDto } from '@sofe/shared';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Search')
@Controller('search')
@Public()
export class SearchController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Unified search across published courses, articles, books, and videos' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query() query: SearchQueryDto) {
    return this.contentService.search(query);
  }
}
