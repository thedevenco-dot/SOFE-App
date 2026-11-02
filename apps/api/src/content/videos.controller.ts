import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VideoQueryDto } from '@sofe/shared';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Standalone Videos')
@Controller('videos')
@Public()
export class VideosController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published standalone videos with filters and cursor pagination' })
  @ApiResponse({ status: 200, description: 'List of published standalone videos' })
  async listVideos(@Query() query: VideoQueryDto) {
    return this.contentService.listVideos(query);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published standalone video details by slug' })
  @ApiResponse({ status: 200, description: 'Video details' })
  async getVideoBySlug(@Param('slug') slug: string) {
    const video = await this.contentService.getVideoBySlug(slug);
    return { data: video };
  }
}
