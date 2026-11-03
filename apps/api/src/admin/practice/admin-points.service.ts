import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ERROR_CODES,
  POINTS_LEDGER_REASONS,
  type PointsRulesDto,
  type AdminAdjustPointsDto,
} from '@sofe/shared';
import { AppConfig, AppConfigDocument } from '../../database/schemas/app-config.schema';
import { PointsService } from '../../points/points.service';
import { AdminAuditService } from '../admin-audit.service';

const DEFAULT_POINTS_RULES: PointsRulesDto = {
  quizPoints: 50,
  lessonPoints: 25,
  dailyStreakBonus: 50,
  maxDailyPoints: 500,
  freeCourseCost: 500,
};

@Injectable()
export class AdminPointsService {
  constructor(
    @InjectModel(AppConfig.name)
    private readonly appConfigModel: Model<AppConfigDocument>,
    private readonly pointsService: PointsService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async getPointsRules(): Promise<PointsRulesDto> {
    const config = await this.appConfigModel.findOne({ key: 'points_rules' }).lean();
    if (!config || !config.value) {
      return DEFAULT_POINTS_RULES;
    }
    return {
      ...DEFAULT_POINTS_RULES,
      ...(config.value as Partial<PointsRulesDto>),
    };
  }

  async updatePointsRules(
    dto: PointsRulesDto,
    adminId?: string,
    adminEmail = 'admin@sofe.io',
    ip = '127.0.0.1',
    userAgent = 'admin-ui',
  ): Promise<PointsRulesDto> {
    const before = await this.getPointsRules();

    await this.appConfigModel.findOneAndUpdate(
      { key: 'points_rules' },
      { $set: { key: 'points_rules', value: dto, updatedBy: adminId } },
      { upsert: true, new: true },
    );

    // Record audit log
    if (adminId) {
      await this.adminAuditService
        .createLog({
          actorAdminId: adminId,
          actorEmail: adminEmail,
          action: 'update',
          entityType: 'points_rules',
          entityId: 'points_rules',
          before: before as unknown as Record<string, unknown>,
          after: dto as unknown as Record<string, unknown>,
          ip,
          userAgent,
        })
        .catch(() => null);
    }

    return dto;
  }

  async adjustUserPoints(
    dto: AdminAdjustPointsDto,
    adminId?: string,
    adminEmail = 'admin@sofe.io',
    ip = '127.0.0.1',
    userAgent = 'admin-ui',
  ) {
    if (dto.amount === 0) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Amount cannot be zero',
      });
    }

    const idempotencyKey = `admin_adjust:${dto.userId}:${Date.now()}`;
    const entry = await this.pointsService.awardPoints({
      userId: dto.userId,
      amount: dto.amount,
      reason: POINTS_LEDGER_REASONS.ADMIN_ADJUST,
      idempotencyKey,
      note: dto.note,
    });

    if (adminId) {
      await this.adminAuditService
        .createLog({
          actorAdminId: adminId,
          actorEmail: adminEmail,
          action: 'adjust_points',
          entityType: 'user_points',
          entityId: dto.userId,
          after: {
            amount: dto.amount,
            newBalance: entry.balanceAfter,
            note: dto.note,
          },
          ip,
          userAgent,
        })
        .catch(() => null);
    }

    return entry;
  }
}
