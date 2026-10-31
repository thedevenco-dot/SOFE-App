import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { ERROR_CODES, USER_STATUSES } from '@sofe/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { FirebaseService } from '../../auth/firebase/firebase.service';
import { User, UserDocument } from '../../database/schemas/user.schema';

interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

@Injectable()
export class LearnerAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseService: FirebaseService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Missing Bearer authentication token',
      });
    }

    const decoded = await this.firebaseService.verifyIdToken(token);
    const user = await this.userModel.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'User profile not found. Please initialize session via POST /auth/session.',
      });
    }

    // Suspended users can sign in and read, but all write actions return ACCOUNT_SUSPENDED
    const isWriteMethod = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method.toUpperCase());
    if (user.status === USER_STATUSES.SUSPENDED && isWriteMethod) {
      throw new ForbiddenException({
        code: ERROR_CODES.ACCOUNT_SUSPENDED,
        message: 'Your account is suspended. All write actions are disabled.',
      });
    }

    request.user = user;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
