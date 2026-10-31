import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_CODES, type PatchMeInput, type ApiSuccessEnvelope } from '@sofe/shared';
import { User, UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async getMe(user: UserDocument): Promise<ApiSuccessEnvelope<UserDocument>> {
    return {
      data: user,
    };
  }

  async updateMe(
    user: UserDocument,
    updateData: PatchMeInput,
  ): Promise<ApiSuccessEnvelope<UserDocument>> {
    // Always filter by authenticated user ID from token
    const updated = await this.userModel.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User profile not found',
      });
    }

    return {
      data: updated,
    };
  }
}
