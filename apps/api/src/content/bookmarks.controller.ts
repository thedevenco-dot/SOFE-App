import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBookmarkDto } from '@sofe/shared';
import { Auth, CurrentUser } from '../common/decorators';
import { type UserDocument } from '../database/schemas';
import { ContentService } from './content.service';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@Auth()
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'List bookmarks for current user' })
  @ApiResponse({ status: 200, description: 'User bookmarks list' })
  async listBookmarks(@CurrentUser() user: UserDocument, @Query('targetType') targetType?: string) {
    const data = await this.contentService.listBookmarks(user._id.toString(), targetType);
    return { data };
  }

  @Post()
  @ApiOperation({ summary: 'Create or toggle a bookmark' })
  @ApiResponse({ status: 201, description: 'Bookmark saved' })
  async createBookmark(@CurrentUser() user: UserDocument, @Body() dto: CreateBookmarkDto) {
    const bookmark = await this.contentService.createBookmark(
      user._id.toString(),
      dto.targetType,
      dto.targetId,
    );
    return { data: bookmark };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark by targetId or bookmarkId' })
  @ApiResponse({ status: 200, description: 'Bookmark deleted' })
  async deleteBookmark(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Query('targetType') targetType: string = 'article',
  ) {
    return this.contentService.deleteBookmark(user._id.toString(), targetType, id);
  }
}
