import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser, Public } from '../common/decorators';
import { type UserDocument } from '../database/schemas';
import { ContentService } from './content.service';

@ApiTags('Topics')
@Controller('topics')
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

  @Get('followed')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get IDs of topics followed by current user' })
  @ApiResponse({ status: 200, description: 'List of followed topic IDs' })
  async getFollowedTopics(@CurrentUser() user: UserDocument) {
    const followed = await this.contentService.getFollowedTopics(user._id.toString());
    return { data: followed };
  }

  @Post(':id/follow')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a topic' })
  @ApiResponse({ status: 200, description: 'Topic followed successfully' })
  async followTopic(@Param('id') topicId: string, @CurrentUser() user: UserDocument) {
    return this.contentService.followTopic(user._id.toString(), topicId);
  }

  @Delete(':id/follow')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a topic' })
  @ApiResponse({ status: 200, description: 'Topic unfollowed successfully' })
  async unfollowTopic(@Param('id') topicId: string, @CurrentUser() user: UserDocument) {
    return this.contentService.unfollowTopic(user._id.toString(), topicId);
  }
}
