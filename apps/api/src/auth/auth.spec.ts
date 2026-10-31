import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase/firebase.service';
import { User, UserDocument } from '../database/schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    firebaseUid: 'test-learner-1',
    name: 'Test Founder',
    email: 'learner@example.com',
    status: 'active',
    pushTokens: [{ token: 'push-token-123' }],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserModel = Object.assign(
    jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue(true),
    })),
    {
      findOne: jest.fn(),
    },
  );

  const mockFirebaseService = {
    verifyIdToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrLoadSession', () => {
    it('should throw UnauthorizedException if token is missing', async () => {
      await expect(service.createOrLoadSession('')).rejects.toThrow(UnauthorizedException);
    });

    it('should load existing user and return session', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValueOnce({
        uid: 'test-learner-1',
        email: 'learner@example.com',
      });
      mockUserModel.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.createOrLoadSession('valid-token');
      expect(result.data.isNewUser).toBe(false);
      expect(result.data.user.firebaseUid).toBe('test-learner-1');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should create new user if user does not exist', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValueOnce({
        uid: 'new-learner-99',
        email: 'new@example.com',
        name: 'New Founder',
      });
      mockUserModel.findOne.mockResolvedValueOnce(null);

      const result = await service.createOrLoadSession('valid-token');
      expect(result.data.isNewUser).toBe(true);
      expect(result.data.user.firebaseUid).toBe('new-learner-99');
    });
  });

  describe('logout', () => {
    it('should remove push token if provided', async () => {
      const user = {
        pushTokens: [{ token: 'token-to-remove' }, { token: 'other-token' }],
        save: jest.fn().mockResolvedValue(true),
      };

      const result = await service.logout(user as unknown as UserDocument, 'token-to-remove');
      expect(result.data.success).toBe(true);
      expect(user.pushTokens).toHaveLength(1);
      expect(user.save).toHaveBeenCalled();
    });
  });
});
