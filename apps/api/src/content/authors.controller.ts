import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Public Authors')
@Controller('authors')
@Public()
export class AuthorsController {
  constructor(private readonly contentService: ContentService) {}

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get author profile and their published articles' })
  @ApiResponse({ status: 200, description: 'Author details' })
  async getAuthorById(@Param('id') id: string) {
    const author = await this.contentService.getAuthorById(id);
    return { data: author };
  }
}
