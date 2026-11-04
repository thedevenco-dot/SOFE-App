import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectDocument } from '../database/schemas/project.schema';
import { User } from '../database/schemas/user.schema';

describe('ProjectsService (Task T3.9)', () => {
  let service: ProjectsService;
  let mockProjectModel: Record<string, jest.Mock>;
  let mockUserModel: Record<string, jest.Mock>;

  const validUserId = new Types.ObjectId().toString();
  const validProjectId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockProjectModel = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getModelToken(Project.name),
          useValue: mockProjectModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('creates a draft project without incrementing user counters', async () => {
      const mockDoc = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        title: 'My Project',
        summary: 'Project summary',
        status: 'draft',
        visibility: 'public',
        toObject: () => ({
          _id: new Types.ObjectId(validProjectId),
          userId: new Types.ObjectId(validUserId),
          title: 'My Project',
          summary: 'Project summary',
          status: 'draft',
          visibility: 'public',
        }),
      };
      mockProjectModel.create.mockResolvedValue(mockDoc);

      const res = await service.create(validUserId, {
        title: 'My Project',
        summary: 'Project summary',
        status: 'draft',
        visibility: 'public',
        files: [],
        links: [],
        tags: [],
      });

      expect(res.id).toBe(validProjectId);
      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });

    it('creates a published project and increments user counters', async () => {
      const mockDoc = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        title: 'Published Project',
        summary: 'Project summary',
        status: 'published',
        visibility: 'public',
        toObject: () => ({
          _id: new Types.ObjectId(validProjectId),
          userId: new Types.ObjectId(validUserId),
          title: 'Published Project',
          summary: 'Project summary',
          status: 'published',
          visibility: 'public',
        }),
      };
      mockProjectModel.create.mockResolvedValue(mockDoc);

      const res = await service.create(validUserId, {
        title: 'Published Project',
        summary: 'Project summary',
        status: 'published',
        visibility: 'public',
        files: [],
        links: [],
        tags: [],
      });

      expect(res.status).toBe('published');
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: mockDoc.userId },
        { $inc: { 'counters.projects': 1 } },
      );
    });

    it('throws BadRequestException for invalid userId', async () => {
      await expect(
        service.create('invalid-id', {
          title: 'Test',
          summary: 'Test',
          status: 'draft',
          visibility: 'public',
          files: [],
          links: [],
          tags: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('returns published project for any user', async () => {
      const mockProj = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        title: 'Project Title',
        summary: 'Project Summary',
        status: 'published',
        visibility: 'public',
      };
      mockProjectModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProj),
      });
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(validUserId),
          name: 'Author Name',
          headline: 'Founder',
        }),
      });

      const res = await service.findById(validProjectId);
      expect(res.title).toBe('Project Title');
      expect(res.author?.name).toBe('Author Name');
    });

    it('allows owner to view their draft project', async () => {
      const mockProj = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        title: 'Draft Project',
        summary: 'Draft',
        status: 'draft',
        visibility: 'public',
      };
      mockProjectModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProj),
      });
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(validUserId), name: 'Owner' }),
      });

      const res = await service.findById(validProjectId, validUserId);
      expect(res.status).toBe('draft');
    });

    it('throws NotFoundException when non-owner tries to view draft project', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const mockProj = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        title: 'Draft Project',
        summary: 'Draft',
        status: 'draft',
        visibility: 'public',
      };
      mockProjectModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProj),
      });

      await expect(service.findById(validProjectId, otherUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when non-owner tries to view private project', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const mockProj = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        title: 'Private Project',
        summary: 'Private',
        status: 'published',
        visibility: 'private',
      };
      mockProjectModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProj),
      });

      await expect(service.findById(validProjectId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('list', () => {
    it('returns filtered items with author mappings', async () => {
      const mockItems = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(validUserId),
          title: 'Project 1',
          summary: 'Summary 1',
          status: 'published',
          visibility: 'public',
        },
      ];

      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockItems),
      };
      mockProjectModel.find.mockReturnValue(chain);
      mockProjectModel.countDocuments.mockResolvedValue(1);

      mockUserModel.find.mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue([{ _id: new Types.ObjectId(validUserId), name: 'Alice' }]),
      });

      const res = await service.list({ page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.items[0].author?.name).toBe('Alice');
      expect(res.total).toBe(1);
    });
  });

  describe('update', () => {
    it('throws ForbiddenException when updating another user project', async () => {
      const otherUserId = new Types.ObjectId().toString();
      mockProjectModel.findById.mockResolvedValue({
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        status: 'draft',
      });

      await expect(service.update(validProjectId, otherUserId, { title: 'New' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('updates status from draft to published and increments counter', async () => {
      const projectDoc = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        status: 'draft',
        title: 'Old Title',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: new Types.ObjectId(validProjectId),
          userId: new Types.ObjectId(validUserId),
          status: 'published',
          title: 'New Title',
        }),
      } as unknown as ProjectDocument;
      mockProjectModel.findById.mockResolvedValue(projectDoc);

      const res = await service.update(validProjectId, validUserId, {
        status: 'published',
        title: 'New Title',
      });

      expect(res.title).toBe('New Title');
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: projectDoc.userId },
        { $inc: { 'counters.projects': 1 } },
      );
    });
  });

  describe('delete', () => {
    it('deletes project and decrements counter if it was published', async () => {
      const projectDoc = {
        _id: new Types.ObjectId(validProjectId),
        userId: new Types.ObjectId(validUserId),
        status: 'published',
      };
      mockProjectModel.findById.mockResolvedValue(projectDoc);
      mockProjectModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const res = await service.delete(validProjectId, validUserId);
      expect(res.success).toBe(true);
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: projectDoc.userId },
        { $inc: { 'counters.projects': -1 } },
      );
      expect(mockProjectModel.deleteOne).toHaveBeenCalledWith({ _id: validProjectId });
    });
  });
});
