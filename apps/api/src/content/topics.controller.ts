import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Topics')
@Controller('topics')
@Public()
export class TopicsController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all topics, optionally filtered to top tabs' })
  @ApiResponse({ status: 200, description: 'Topics list' })
  async listTopics(@Query('isTab') isTab?: string) {
    const isTabOnly = isTab === 'true' || isTab === '1';
    const topics = await this.contentService.listTopics(isTabOnly);
    return { data: topics };
  }
}
