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
  CreateVideoDto,
  createVideoSchema,
  UpdateVideoDto,
  updateVideoSchema,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';
import { AdminVideosService, VideoFilterQuery } from './admin-videos.service';

export interface BulkVideoActionDto {
  ids: string[];
  action: 'archive' | 'delete';
}

@ApiTags('Admin Videos')
@Controller('admin/videos')
@UseInterceptors(AuditLogInterceptor)
export class AdminVideosController {
  constructor(private readonly videosService: AdminVideosService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_READ)
  @ApiOperation({ summary: 'List standalone videos with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated videos list' })
  async listVideos(@Query() query: VideoFilterQuery) {
    return this.videosService.listVideos(query);
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_WRITE)
  @AuditAction('create', 'video')
  @ApiOperation({ summary: 'Create a new standalone video' })
  @ApiResponse({ status: 201, description: 'Video created successfully' })
  async createVideo(
    @Body(new ZodValidationPipe(createVideoSchema)) dto: CreateVideoDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.videosService.createVideo(dto, admin?._id?.toString());
  }

  @Get(':id')
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_READ)
  @ApiOperation({ summary: 'Get standalone video by ID' })
  @ApiResponse({ status: 200, description: 'Video details' })
  async getVideoById(@Param('id') id: string) {
    return this.videosService.getVideoById(id);
  }

  @Put(':id')
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_WRITE)
  @AuditAction('update', 'video')
  @ApiOperation({ summary: 'Update standalone video details' })
  @ApiResponse({ status: 200, description: 'Video updated successfully' })
  async updateVideo(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVideoSchema)) dto: UpdateVideoDto,
    @CurrentAdmin() admin?: AdminUserDocument,
  ) {
    return this.videosService.updateVideo(id, dto, admin?._id?.toString());
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_WRITE)
  @AuditAction('delete', 'video')
  @ApiOperation({ summary: 'Delete standalone video' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  async deleteVideo(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.videosService.deleteVideo(id, admin?._id?.toString());
  }

  @Post(':id/publish')
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_WRITE)
  @AuditAction('publish', 'video')
  @ApiOperation({ summary: 'Publish standalone video' })
  @ApiResponse({ status: 200, description: 'Video published' })
  async publishVideo(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.videosService.publishVideo(id, admin?._id?.toString());
  }

  @Post(':id/unpublish')
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_WRITE)
  @AuditAction('unpublish', 'video')
  @ApiOperation({ summary: 'Unpublish standalone video (revert to draft)' })
  @ApiResponse({ status: 200, description: 'Video reverted to draft' })
  async unpublishVideo(@Param('id') id: string, @CurrentAdmin() admin?: AdminUserDocument) {
    return this.videosService.unpublishVideo(id, admin?._id?.toString());
  }

  @Post('bulk')
  @AdminAuth(ADMIN_PERMISSIONS.MEDIA_WRITE)
  @AuditAction('bulk_action', 'video')
  @ApiOperation({ summary: 'Bulk archive or delete standalone videos' })
  @ApiResponse({ status: 200, description: 'Bulk operation result' })
  async bulkAction(@Body() body: BulkVideoActionDto) {
    return this.videosService.bulkAction(body.ids, body.action);
  }
}
