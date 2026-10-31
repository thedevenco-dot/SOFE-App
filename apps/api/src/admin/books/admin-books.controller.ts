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
  CreateBookDto,
  createBookSchema,
  UpdateBookDto,
  updateBookSchema,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AdminBooksService, BookFilterQuery } from './admin-books.service';

export interface BulkBookActionDto {
  ids: string[];
  action: 'archive' | 'delete';
}

@ApiTags('Admin Books')
@Controller('admin/books')
@UseInterceptors(AuditLogInterceptor)
export class AdminBooksController {
  constructor(private readonly booksService: AdminBooksService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'List books with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated books list' })
  async listBooks(@Query() query: BookFilterQuery) {
    return this.booksService.listBooks(query);
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('create', 'book')
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  async createBook(
    @Body(new ZodValidationPipe(createBookSchema)) dto: CreateBookDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.booksService.createBook(dto, admin?._id?.toString());
  }

  @Get(':id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_READ)
  @ApiOperation({ summary: 'Get book by ID' })
  @ApiResponse({ status: 200, description: 'Book details' })
  async getBookById(@Param('id') id: string) {
    return this.booksService.getBookById(id);
  }

  @Put(':id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('update', 'book')
  @ApiOperation({ summary: 'Update book details' })
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  async updateBook(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBookSchema)) dto: UpdateBookDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.booksService.updateBook(id, dto, admin?._id?.toString());
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('delete', 'book')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  async deleteBook(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.booksService.deleteBook(id, admin?._id?.toString());
  }

  @Post(':id/publish')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_PUBLISH)
  @AuditAction('publish', 'book')
  @ApiOperation({ summary: 'Publish a book' })
  @ApiResponse({ status: 200, description: 'Book published' })
  async publishBook(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.booksService.publishBook(id, admin?._id?.toString());
  }

  @Post(':id/unpublish')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('unpublish', 'book')
  @ApiOperation({ summary: 'Unpublish a book (revert to draft)' })
  @ApiResponse({ status: 200, description: 'Book reverted to draft' })
  async unpublishBook(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.booksService.unpublishBook(id, admin?._id?.toString());
  }

  @Post('bulk')
  @AdminAuth(ADMIN_PERMISSIONS.COURSE_WRITE)
  @AuditAction('bulk_action', 'book')
  @ApiOperation({ summary: 'Bulk archive or delete books' })
  @ApiResponse({ status: 200, description: 'Bulk operation result' })
  async bulkAction(@Body() body: BulkBookActionDto) {
    return this.booksService.bulkAction(body.ids, body.action);
  }
}
