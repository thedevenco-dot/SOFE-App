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
  type CreateReflectionPromptDto,
  type UpdateReflectionPromptDto,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AdminQuotesPromptsService } from './admin-quotes-prompts.service';

@ApiTags('Admin Quotes & Prompts Library')
@Controller('admin/quotes-prompts')
@UseInterceptors(AuditLogInterceptor)
export class AdminQuotesPromptsController {
  constructor(private readonly service: AdminQuotesPromptsService) {}

  // Quotes
  @Get('quotes')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_READ)
  @ApiOperation({ summary: 'List all quotes' })
  @ApiResponse({ status: 200, description: 'Quotes list' })
  async listQuotes(@Query('status') status?: string) {
    return this.service.listQuotes(status);
  }

  @Post('quotes')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('create', 'quote')
  @ApiOperation({ summary: 'Create quote' })
  @ApiResponse({ status: 201, description: 'Quote created' })
  async createQuote(
    @Body()
    dto: {
      text: string;
      author?: string;
      tags?: string[];
      status?: 'draft' | 'published' | 'archived';
    },
  ) {
    return this.service.createQuote(dto);
  }

  @Patch('quotes/:id')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('update', 'quote')
  @ApiOperation({ summary: 'Update quote' })
  @ApiResponse({ status: 200, description: 'Quote updated' })
  async updateQuote(
    @Param('id') id: string,
    @Body()
    dto: Partial<{
      text: string;
      author: string;
      tags: string[];
      status: 'draft' | 'published' | 'archived';
    }>,
  ) {
    return this.service.updateQuote(id, dto);
  }

  @Delete('quotes/:id')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('delete', 'quote')
  @ApiOperation({ summary: 'Delete quote' })
  @ApiResponse({ status: 200, description: 'Quote deleted' })
  async deleteQuote(@Param('id') id: string) {
    return this.service.deleteQuote(id);
  }

  // Words
  @Get('words')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_READ)
  @ApiOperation({ summary: 'List all manifestation words' })
  @ApiResponse({ status: 200, description: 'Words list' })
  async listWords(@Query('status') status?: string) {
    return this.service.listWords(status);
  }

  @Post('words')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('create', 'word')
  @ApiOperation({ summary: 'Create manifestation word' })
  @ApiResponse({ status: 201, description: 'Word created' })
  async createWord(
    @Body() dto: { word: string; meaning?: string; status?: 'draft' | 'published' | 'archived' },
  ) {
    return this.service.createWord(dto);
  }

  @Patch('words/:id')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('update', 'word')
  @ApiOperation({ summary: 'Update word' })
  @ApiResponse({ status: 200, description: 'Word updated' })
  async updateWord(
    @Param('id') id: string,
    @Body()
    dto: Partial<{ word: string; meaning: string; status: 'draft' | 'published' | 'archived' }>,
  ) {
    return this.service.updateWord(id, dto);
  }

  @Delete('words/:id')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('delete', 'word')
  @ApiOperation({ summary: 'Delete word' })
  @ApiResponse({ status: 200, description: 'Word deleted' })
  async deleteWord(@Param('id') id: string) {
    return this.service.deleteWord(id);
  }

  // Prompts
  @Get('prompts')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_READ)
  @ApiOperation({ summary: 'List reflection prompts' })
  @ApiResponse({ status: 200, description: 'Prompts list' })
  async listPrompts(@Query('activeOnly') activeOnly?: string) {
    return this.service.listPrompts(activeOnly === 'true');
  }

  @Post('prompts')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('create', 'reflection_prompt')
  @ApiOperation({ summary: 'Create reflection prompt' })
  @ApiResponse({ status: 201, description: 'Prompt created' })
  async createPrompt(@Body() dto: CreateReflectionPromptDto) {
    return this.service.createPrompt(dto);
  }

  @Patch('prompts/:id')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('update', 'reflection_prompt')
  @ApiOperation({ summary: 'Update reflection prompt' })
  @ApiResponse({ status: 200, description: 'Prompt updated' })
  async updatePrompt(@Param('id') id: string, @Body() dto: UpdateReflectionPromptDto) {
    return this.service.updatePrompt(id, dto);
  }

  @Delete('prompts/:id')
  @AdminAuth(ADMIN_PERMISSIONS.QUOTE_WRITE)
  @AuditAction('delete', 'reflection_prompt')
  @ApiOperation({ summary: 'Delete reflection prompt' })
  @ApiResponse({ status: 200, description: 'Prompt deleted' })
  async deletePrompt(@Param('id') id: string) {
    return this.service.deletePrompt(id);
  }
}
