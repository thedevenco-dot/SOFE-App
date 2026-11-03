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
import { ADMIN_PERMISSIONS, type CreateRewardDto, type UpdateRewardDto } from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AdminRewardsService } from './admin-rewards.service';

@ApiTags('Admin Rewards')
@Controller('admin/rewards')
@UseInterceptors(AuditLogInterceptor)
export class AdminRewardsController {
  constructor(private readonly rewardsService: AdminRewardsService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.REWARD_READ)
  @ApiOperation({ summary: 'List all rewards in the store' })
  @ApiResponse({ status: 200, description: 'Rewards list' })
  async listRewards(@Query('status') status?: string) {
    return this.rewardsService.listRewards(status);
  }

  @Post()
  @AdminAuth(ADMIN_PERMISSIONS.REWARD_WRITE)
  @AuditAction('create', 'reward')
  @ApiOperation({ summary: 'Create new reward item' })
  @ApiResponse({ status: 201, description: 'Reward created' })
  async createReward(@Body() dto: CreateRewardDto) {
    return this.rewardsService.createReward(dto);
  }

  @Get(':id')
  @AdminAuth(ADMIN_PERMISSIONS.REWARD_READ)
  @ApiOperation({ summary: 'Get reward details by ID' })
  @ApiResponse({ status: 200, description: 'Reward details' })
  async getRewardById(@Param('id') id: string) {
    return this.rewardsService.getRewardById(id);
  }

  @Patch(':id')
  @AdminAuth(ADMIN_PERMISSIONS.REWARD_WRITE)
  @AuditAction('update', 'reward')
  @ApiOperation({ summary: 'Update reward item' })
  @ApiResponse({ status: 200, description: 'Reward updated' })
  async updateReward(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.rewardsService.updateReward(id, dto);
  }

  @Delete(':id')
  @AdminAuth(ADMIN_PERMISSIONS.REWARD_WRITE)
  @AuditAction('delete', 'reward')
  @ApiOperation({ summary: 'Delete reward item' })
  @ApiResponse({ status: 200, description: 'Reward deleted' })
  async deleteReward(@Param('id') id: string) {
    return this.rewardsService.deleteReward(id);
  }
}
