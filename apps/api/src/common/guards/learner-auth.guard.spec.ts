import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LearnerAuthGuard } from './learner-auth.guard';
import { USER_STATUSES } from '@sofe/shared';
import { FirebaseService } from '../../auth/firebase/firebase.service';
import { UserDocument } from '../../database/schemas/user.schema';
import { Model } from 'mongoose';

describe('LearnerAuthGuard', () => {
  let guard: LearnerAuthGuard;
  let reflector: Reflector;
  let mockFirebaseService: { verifyIdToken: jest.Mock };
  let mockUserModel: { findOne: jest.Mock };

  beforeEach(() => {
    reflector = new Reflector();
    mockFirebaseService = {
      verifyIdToken: jest.fn(),
    };
    mockUserModel = {
      findOne: jest.fn(),
    };
    guard = new LearnerAuthGuard(
      reflector,
      mockFirebaseService as unknown as FirebaseService,
      mockUserModel as unknown as Model<UserDocument>,
    );
  });

  function createMockContext(
    request: Record<string, unknown>,
    handler = () => {},
    targetClass = class {},
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => targetClass,
    } as unknown as ExecutionContext;
  }

  it('should allow access if route is @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    const context = createMockContext({});

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(mockFirebaseService.verifyIdToken).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    const context = createMockContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user not found in database', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    mockFirebaseService.verifyIdToken.mockResolvedValueOnce({ uid: 'non-existent' });
    mockUserModel.findOne.mockResolvedValueOnce(null);

    const context = createMockContext({
      headers: { authorization: 'Bearer some-token' },
      method: 'GET',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user is suspended and attempts a write method', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    mockFirebaseService.verifyIdToken.mockResolvedValueOnce({ uid: 'suspended-user' });
    mockUserModel.findOne.mockResolvedValueOnce({
      firebaseUid: 'suspended-user',
      status: USER_STATUSES.SUSPENDED,
    });

    const context = createMockContext({
      headers: { authorization: 'Bearer some-token' },
      method: 'PATCH',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow read access for suspended user', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    const userDoc = {
      firebaseUid: 'suspended-user',
      status: USER_STATUSES.SUSPENDED,
    };
    mockFirebaseService.verifyIdToken.mockResolvedValueOnce({ uid: 'suspended-user' });
    mockUserModel.findOne.mockResolvedValueOnce(userDoc);

    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer some-token' },
      method: 'GET',
    };
    const context = createMockContext(request);

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(request['user']).toBe(userDoc);
  });

  it('should allow access and attach user for active learner', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    const userDoc = {
      firebaseUid: 'active-user',
      status: USER_STATUSES.ACTIVE,
    };
    mockFirebaseService.verifyIdToken.mockResolvedValueOnce({ uid: 'active-user' });
    mockUserModel.findOne.mockResolvedValueOnce(userDoc);

    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer valid-token' },
      method: 'PATCH',
    };
    const context = createMockContext(request);

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(request['user']).toBe(userDoc);
  });
});
