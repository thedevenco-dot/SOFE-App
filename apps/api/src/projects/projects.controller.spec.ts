import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../auth/firebase/firebase.service';
import { Request } from 'express';
import { User, UserDocument } from '../database/schemas/user.schema';

describe('ProjectsController (Task T3.9)', () => {
  let controller: ProjectsController;

  const mockService = {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFirebaseService = {
    verifyIdToken: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
  };

  const mockUser = {
    _id: { toString: () => 'user_123' },
    firebaseUid: 'fb_123',
    name: 'Learner User',
  } as unknown as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockService,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates project with current user', async () => {
      mockService.create.mockResolvedValue({ id: 'proj_1', title: 'New Proj' });
      const res = await controller.create(mockUser, {
        title: 'New Proj',
        summary: 'Summary',
        status: 'draft',
        visibility: 'public',
        files: [],
        links: [],
        tags: [],
      });
      expect(mockService.create).toHaveBeenCalledWith('user_123', expect.any(Object));
      expect(res.data.id).toBe('proj_1');
    });
  });

  describe('list', () => {
    it('lists projects and extracts user token if provided', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValue({ uid: 'fb_123' });
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: { toString: () => 'user_123' } }),
      });
      mockService.list.mockResolvedValue({
        items: [{ id: 'p1' }],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });

      const mockReq = {
        headers: { authorization: 'Bearer test_token' },
      } as unknown as Request;

      const res = await controller.list({ page: 1, limit: 20 }, mockReq);
      expect(mockService.list).toHaveBeenCalledWith({ page: 1, limit: 20 }, 'user_123');
      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns project details', async () => {
      mockService.findById.mockResolvedValue({ id: 'proj_1', title: 'My Proj' });
      const mockReq = { headers: {} } as unknown as Request;
      const res = await controller.getById('proj_1', mockReq);
      expect(mockService.findById).toHaveBeenCalledWith('proj_1', undefined);
      expect(res.data.id).toBe('proj_1');
    });
  });

  describe('update', () => {
    it('updates project', async () => {
      mockService.update.mockResolvedValue({ id: 'proj_1', title: 'Updated' });
      const res = await controller.update('proj_1', mockUser, { title: 'Updated' });
      expect(mockService.update).toHaveBeenCalledWith('proj_1', 'user_123', {
        title: 'Updated',
      });
      expect(res.data.title).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes project', async () => {
      mockService.delete.mockResolvedValue({ success: true });
      const res = await controller.delete('proj_1', mockUser);
      expect(mockService.delete).toHaveBeenCalledWith('proj_1', 'user_123');
      expect(res.success).toBe(true);
    });
  });
});
