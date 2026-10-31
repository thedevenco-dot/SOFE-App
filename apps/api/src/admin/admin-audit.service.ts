import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema';

export interface CreateAuditLogDto {
  actorAdminId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip: string;
  userAgent: string;
}

export interface QueryAuditLogsDto {
  actorAdminId?: string;
  entityType?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async createLog(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    try {
      const log = new this.auditLogModel(dto);
      return await log.save();
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${(err as Error).message}`);
      throw err;
    }
  }

  async findLogs(query: QueryAuditLogsDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const filter: Record<string, unknown> = {};

    if (query.actorAdminId) filter.actorAdminId = query.actorAdminId;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
