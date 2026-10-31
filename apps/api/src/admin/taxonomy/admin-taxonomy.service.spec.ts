import { Types } from 'mongoose';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AdminTaxonomyService } from './admin-taxonomy.service';

describe('AdminTaxonomyService', () => {
  let service: AdminTaxonomyService;

  const validId = new Types.ObjectId().toHexString();
  const anotherId = new Types.ObjectId().toHexString();

  type MockModel = {
    (dto: Record<string, unknown>): {
      _id: string;
      save: jest.Mock;
    };
    find: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };

  // Helper for mock mongoose model
  const createMockModel = (): MockModel => {
    const fn = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      _id: validId,
      save: jest.fn().mockResolvedValue({ _id: validId, ...dto }),
    })) as unknown as MockModel;
    fn.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ _id: validId, name: 'Sample' }]),
      }),
    });
    fn.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: validId, name: 'Sample' }),
    });
    fn.findOne = jest.fn().mockResolvedValue(null);
    fn.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: validId, name: 'Updated' }),
    });
    fn.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: validId, name: 'Deleted' }),
    });
    return fn;
  };

  let mockCategoryModel: MockModel;
  let mockInstructorModel: MockModel;
  let mockTopicModel: MockModel;
  let mockAuthorModel: MockModel;

  beforeEach(() => {
    mockCategoryModel = createMockModel();
    mockInstructorModel = createMockModel();
    mockTopicModel = createMockModel();
    mockAuthorModel = createMockModel();

    service = new AdminTaxonomyService(
      mockCategoryModel as unknown as ConstructorParameters<typeof AdminTaxonomyService>[0],
      mockInstructorModel as unknown as ConstructorParameters<typeof AdminTaxonomyService>[1],
      mockTopicModel as unknown as ConstructorParameters<typeof AdminTaxonomyService>[2],
      mockAuthorModel as unknown as ConstructorParameters<typeof AdminTaxonomyService>[3],
    );
  });

  describe('Categories', () => {
    it('listCategories returns categories sorted by order then name', async () => {
      const res = await service.listCategories();
      expect(mockCategoryModel.find).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('getCategoryById returns category when found', async () => {
      const res = await service.getCategoryById(validId);
      expect(mockCategoryModel.findById).toHaveBeenCalledWith(validId);
      expect(res._id).toBe(validId);
    });

    it('getCategoryById throws NotFoundException when invalid id or not found', async () => {
      await expect(service.getCategoryById('invalid-id')).rejects.toThrow(NotFoundException);

      mockCategoryModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.getCategoryById(validId)).rejects.toThrow(NotFoundException);
    });

    it('createCategory creates a new category when slug/name are unique', async () => {
      const dto = { name: 'Tech', slug: 'tech', order: 1 };
      const res = await service.createCategory(dto);
      expect(res).toBeDefined();
      expect(res.name).toBe('Tech');
    });

    it('createCategory throws ConflictException if name/slug exists', async () => {
      mockCategoryModel.findOne.mockResolvedValueOnce({ _id: anotherId, slug: 'tech' });
      await expect(
        service.createCategory({ name: 'Tech', slug: 'tech', order: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('updateCategory updates category', async () => {
      const res = await service.updateCategory(validId, { name: 'Tech Updated' });
      expect(res).toBeDefined();
      expect(mockCategoryModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('updateCategory throws ConflictException when slug conflict occurs', async () => {
      mockCategoryModel.findOne.mockResolvedValueOnce({ _id: anotherId, slug: 'tech-2' });
      await expect(service.updateCategory(validId, { slug: 'tech-2' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('deleteCategory removes category and returns confirmation', async () => {
      const res = await service.deleteCategory(validId);
      expect(res.success).toBe(true);
      expect(mockCategoryModel.findByIdAndDelete).toHaveBeenCalledWith(validId);
    });

    it('deleteCategory throws NotFoundException if category does not exist', async () => {
      mockCategoryModel.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.deleteCategory(validId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Instructors', () => {
    it('listInstructors returns list', async () => {
      const res = await service.listInstructors();
      expect(mockInstructorModel.find).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('getInstructorById returns instructor', async () => {
      const res = await service.getInstructorById(validId);
      expect(res).toBeDefined();
    });

    it('createInstructor creates instructor', async () => {
      const res = await service.createInstructor({
        name: 'Paul Graham',
        title: 'Founder',
        bio: 'Y Combinator',
        links: ['https://paulgraham.com'],
      });
      expect(res).toBeDefined();
    });

    it('createInstructor throws ConflictException if duplicate name', async () => {
      mockInstructorModel.findOne.mockResolvedValueOnce({ _id: anotherId, name: 'Paul Graham' });
      await expect(
        service.createInstructor({
          name: 'Paul Graham',
          title: 'Founder',
          bio: 'Y Combinator',
          links: [],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('updateInstructor updates fields', async () => {
      const res = await service.updateInstructor(validId, { title: 'Author & Investor' });
      expect(res).toBeDefined();
    });

    it('deleteInstructor removes instructor', async () => {
      const res = await service.deleteInstructor(validId);
      expect(res.success).toBe(true);
    });
  });

  describe('Topics', () => {
    it('listTopics returns list', async () => {
      const res = await service.listTopics();
      expect(mockTopicModel.find).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('getTopicById returns topic', async () => {
      const res = await service.getTopicById(validId);
      expect(res).toBeDefined();
    });

    it('createTopic creates topic', async () => {
      const res = await service.createTopic({
        name: 'Fundraising',
        slug: 'fundraising',
        order: 1,
        isTab: true,
      });
      expect(res).toBeDefined();
    });

    it('createTopic throws ConflictException on duplicate slug', async () => {
      mockTopicModel.findOne.mockResolvedValueOnce({ _id: anotherId, slug: 'fundraising' });
      await expect(
        service.createTopic({
          name: 'Fundraising',
          slug: 'fundraising',
          order: 1,
          isTab: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('updateTopic updates topic', async () => {
      const res = await service.updateTopic(validId, { isTab: false });
      expect(res).toBeDefined();
    });

    it('deleteTopic removes topic', async () => {
      const res = await service.deleteTopic(validId);
      expect(res.success).toBe(true);
    });
  });

  describe('Authors', () => {
    it('listAuthors returns list', async () => {
      const res = await service.listAuthors();
      expect(mockAuthorModel.find).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('getAuthorById returns author', async () => {
      const res = await service.getAuthorById(validId);
      expect(res).toBeDefined();
    });

    it('createAuthor creates author', async () => {
      const res = await service.createAuthor({
        name: 'Marc Andreessen',
        title: 'Partner at a16z',
        bio: 'Software is eating the world',
      });
      expect(res).toBeDefined();
    });

    it('createAuthor throws ConflictException on duplicate name', async () => {
      mockAuthorModel.findOne.mockResolvedValueOnce({ _id: anotherId, name: 'Marc Andreessen' });
      await expect(
        service.createAuthor({
          name: 'Marc Andreessen',
          title: 'Partner',
          bio: 'Bio',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('updateAuthor updates author', async () => {
      const res = await service.updateAuthor(validId, { title: 'General Partner' });
      expect(res).toBeDefined();
    });

    it('deleteAuthor removes author', async () => {
      const res = await service.deleteAuthor(validId);
      expect(res.success).toBe(true);
    });
  });
});
