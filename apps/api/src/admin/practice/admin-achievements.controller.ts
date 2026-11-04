import {
  Controller,
  Get,
  Post,
  Put,
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
  type CreateAchievementDto,
  type UpdateAchievementDto,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AchievementsService } from '../../achievements/achievements.service';

@ApiTags('Admin Achievements')
@Controller('admin/achievements')
@UseInterceptors(AuditLogInterceptor)
export class AdminAchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.ACHIEVEMENT_READ)
  @ApiOperation({ summary: 'List all achievements' })
  @ApiResponse({ status: 200, description: 'Achievements list' })
  async listAchievements(@Query('status') status?: string) {
    return this.achievementsService.listAllAdmin(status);
  }

  @Post('seed')
  @AdminAuth(ADMIN_PERMISSIONS.ACHIEVEMENT_WRITE)
  @AuditAction('seed', 'achievement')
  @ApiOperation({ summary: 'Seed standard achievement definitions' })
  @ApiResponse({ status: 201, description: 'Achievements seeded' })
  async seedAchievements() {
    return this.achievementsService.seedDefaults();
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.ACHIEVEMENT_WRITE)
  @AuditAction('create', 'achievement')
  @ApiOperation({ summary: 'Create new achievement definition' })
  @ApiResponse({ status: 201, description: 'Achievement created' })
  async createAchievement(@Body() dto: CreateAchievementDto) {
    return this.achievementsService.createAchievement(dto);
  }

  @Put(':id')
  @AdminAuth(ADMIN_PERMISSIONS.ACHIEVEMENT_WRITE)
  @AuditAction('update', 'achievement')
  @ApiOperation({ summary: 'Update achievement definition' })
  @ApiResponse({ status: 200, description: 'Achievement updated' })
  async updateAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto) {
    return this.achievementsService.updateAchievement(id, dto);
  }

  @Patch(':id')
  @AdminAuth(ADMIN_PERMISSIONS.ACHIEVEMENT_WRITE)
  @AuditAction('update', 'achievement')
  @ApiOperation({ summary: 'Patch achievement definition' })
  @ApiResponse({ status: 200, description: 'Achievement updated' })
  async patchAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto) {
    return this.achievementsService.updateAchievement(id, dto);
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.ACHIEVEMENT_WRITE)
  @AuditAction('delete', 'achievement')
  @ApiOperation({ summary: 'Deactivate achievement definition' })
  @ApiResponse({ status: 200, description: 'Achievement deactivated' })
  async deleteAchievement(@Param('id') id: string) {
    return this.achievementsService.deleteAchievement(id);
  }
}
