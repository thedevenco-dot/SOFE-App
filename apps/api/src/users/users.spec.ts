import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserDocument } from '../database/schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Original Founder',
    headline: 'Building something great',
  };

  const mockUserModel = {
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user document in standard envelope', async () => {
      const result = await service.getMe(mockUser as unknown as UserDocument);
      expect(result.data).toBe(mockUser);
    });
  });

  describe('updateMe', () => {
    it('should update user and return updated document', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };
      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce(updatedUser);

      const result = await service.updateMe(mockUser as unknown as UserDocument, {
        name: 'Updated Name',
      });
      expect(result.data.name).toBe('Updated Name');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { $set: { name: 'Updated Name' } },
        { new: true, runValidators: true },
      );
    });

    it('should throw NotFoundException if user cannot be updated', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce(null);

      await expect(
        service.updateMe(mockUser as unknown as UserDocument, { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
