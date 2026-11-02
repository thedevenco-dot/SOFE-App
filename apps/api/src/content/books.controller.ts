import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookQueryDto } from '@sofe/shared';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Books')
@Controller('books')
@Public()
export class BooksController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published books with filters and cursor pagination' })
  @ApiResponse({ status: 200, description: 'List of published books' })
  async listBooks(@Query() query: BookQueryDto) {
    return this.contentService.listBooks(query);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published book details by slug' })
  @ApiResponse({ status: 200, description: 'Book details' })
  async getBookBySlug(@Param('slug') slug: string) {
    const book = await this.contentService.getBookBySlug(slug);
    return { data: book };
  }
}
