import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_CODES, USER_STATUSES, type ApiSuccessEnvelope } from '@sofe/shared';
import { User, UserDocument } from '../database/schemas/user.schema';
import { FirebaseService } from './firebase/firebase.service';

export interface SessionResponse {
  user: UserDocument;
  isNewUser: boolean;
  flags: {
    networkEnabled: boolean;
    certificatesEnabled: boolean;
  };
}

export interface LogoutResponse {
  success: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async createOrLoadSession(token: string): Promise<ApiSuccessEnvelope<SessionResponse>> {
    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Authorization token is required to establish session',
      });
    }

    const decoded = await this.firebaseService.verifyIdToken(token);
    let user = await this.userModel.findOne({ firebaseUid: decoded.uid });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new this.userModel({
        firebaseUid: decoded.uid,
        name: decoded.name || 'Aspiring Founder',
        email: decoded.email,
        phone: decoded.phone_number,
        status: USER_STATUSES.ACTIVE,
        timezone: 'Asia/Kolkata',
        interests: [],
        goals: [],
        counters: { posts: 0, followers: 0, following: 0 },
        streak: { current: 0, longest: 0 },
        pointsBalance: 0,
        settings: {
          notifications: {
            streakReminder: true,
            newContent: true,
            social: true,
            marketing: false,
          },
          reminderTime: '09:00',
          profileVisibility: 'public',
        },
        planPreferences: {
          enabledTaskKeys: ['watch_lesson', 'complete_quiz', 'reflect'],
        },
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return {
      data: {
        user,
        isNewUser,
        flags: {
          networkEnabled: false,
          certificatesEnabled: false,
        },
      },
    };
  }

  async logout(
    user: UserDocument,
    pushToken?: string,
  ): Promise<ApiSuccessEnvelope<LogoutResponse>> {
    if (pushToken && user.pushTokens.length > 0) {
      user.pushTokens = user.pushTokens.filter((pt) => pt.token !== pushToken);
      await user.save();
    }

    return {
      data: {
        success: true,
      },
    };
  }
}
