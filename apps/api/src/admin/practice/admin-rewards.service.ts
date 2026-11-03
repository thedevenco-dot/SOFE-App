import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ERROR_CODES, type CreateRewardDto, type UpdateRewardDto } from '@sofe/shared';
import { Reward, RewardDocument } from '../../database/schemas/reward.schema';

@Injectable()
export class AdminRewardsService {
  constructor(
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
  ) {}

  async listRewards(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }

    const items = await this.rewardModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('courseId', 'title slug thumbnail')
      .lean();

    return items.map((r) => {
      const course = r.courseId as unknown as { _id?: Types.ObjectId; title?: string };
      return {
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        type: r.type,
        costPoints: r.costPoints,
        courseId: course?._id ? course._id.toString() : r.courseId?.toString(),
        courseTitle: course?.title,
        couponCode: r.couponCode,
        stock: r.stock,
        status: r.status,
        createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
      };
    });
  }

  async getRewardById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    const reward = await this.rewardModel
      .findById(id)
      .populate('courseId', 'title slug thumbnail')
      .lean();

    if (!reward) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    const course = reward.courseId as unknown as { _id?: Types.ObjectId; title?: string };

    return {
      id: reward._id.toString(),
      title: reward.title,
      description: reward.description,
      type: reward.type,
      costPoints: reward.costPoints,
      courseId: course?._id ? course._id.toString() : reward.courseId?.toString(),
      courseTitle: course?.title,
      couponCode: reward.couponCode,
      stock: reward.stock,
      status: reward.status,
      createdAt: reward.createdAt ? reward.createdAt.toISOString() : undefined,
      updatedAt: reward.updatedAt ? reward.updatedAt.toISOString() : undefined,
    };
  }

  async createReward(dto: CreateRewardDto) {
    const reward = await this.rewardModel.create({
      ...dto,
      courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
    });
    return this.getRewardById(reward._id.toString());
  }

  async updateReward(id: string, dto: UpdateRewardDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.courseId !== undefined) {
      updateData.courseId = dto.courseId ? new Types.ObjectId(dto.courseId) : undefined;
    }

    const updated = await this.rewardModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    return this.getRewardById(id);
  }

  async deleteReward(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    const res = await this.rewardModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (res.deletedCount === 0) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reward not found',
      });
    }

    return { success: true };
  }
}
