import { Controller, Get, Put, Post, Param, Body, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ADMIN_PERMISSIONS,
  type UpdateScheduleDateDto,
  type CopyWeekScheduleDto,
} from '@sofe/shared';
import { AdminAuth } from '../../common/decorators/admin-auth.decorator';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AdminPracticeScheduleService } from './admin-practice-schedule.service';

@ApiTags('Admin Practice Schedule')
@Controller('admin/practise/schedule')
@UseInterceptors(AuditLogInterceptor)
export class AdminPracticeScheduleController {
  constructor(private readonly scheduleService: AdminPracticeScheduleService) {}

  @Get()
  @AdminAuth(ADMIN_PERMISSIONS.PRACTISE_SCHEDULE)
  @ApiOperation({ summary: 'Get practice schedule with unassigned alerts' })
  @ApiResponse({ status: 200, description: 'Practice schedule calendar' })
  async getSchedule(@Query('from') from?: string, @Query('to') to?: string) {
    return this.scheduleService.getSchedule(from, to);
  }

  @Put(':dateKey')
  @AdminAuth(ADMIN_PERMISSIONS.PRACTISE_SCHEDULE)
  @AuditAction('update', 'practice_schedule')
  @ApiOperation({ summary: 'Set practice slots for date' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  async setSchedule(@Param('dateKey') dateKey: string, @Body() dto: UpdateScheduleDateDto) {
    return this.scheduleService.setScheduleForDate(dateKey, dto.slots);
  }

  @Post('copy-week')
  @AdminAuth(ADMIN_PERMISSIONS.PRACTISE_SCHEDULE)
  @AuditAction('copy_week', 'practice_schedule')
  @ApiOperation({ summary: 'Copy 7 days schedule pattern to another week' })
  @ApiResponse({ status: 200, description: 'Week copied' })
  async copyWeek(@Body() dto: CopyWeekScheduleDto) {
    return this.scheduleService.copyWeek(dto);
  }

  @Post('auto-fill')
  @AdminAuth(ADMIN_PERMISSIONS.PRACTISE_SCHEDULE)
  @AuditAction('autofill', 'practice_schedule')
  @ApiOperation({ summary: 'Auto-fill empty dates with quick quizzes and prompts' })
  @ApiResponse({ status: 200, description: 'Dates auto-filled' })
  async autoFill(@Body() body: { from: string; to: string }) {
    return this.scheduleService.autoFill(body.from, body.to);
  }
}
