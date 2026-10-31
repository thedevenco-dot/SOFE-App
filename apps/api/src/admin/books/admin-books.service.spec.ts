import { Types } from 'mongoose';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminBooksService, slugify } from './admin-books.service';

describe('AdminBooksService', () => {
  let service: AdminBooksService;

  const validBookId = new Types.ObjectId().toHexString();
  const validCategoryId = new Types.ObjectId().toHexString();

  const mockBook = {
    _id: validBookId,
    title: 'Zero to One',
    slug: 'zero-to-one',
    author: 'Peter Thiel',
    coverUrl: 'https://images.example.com/zero.jpg',
    descriptionHtml: '<p>Notes on Startups, or How to Build the Future</p>',
    format: 'summary',
    categoryId: new Types.ObjectId(validCategoryId),
    tags: ['startups', 'venture'],
    isFree: true,
    status: 'draft',
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockReturnValue({
      _id: validBookId,
      title: 'Zero to One',
      slug: 'zero-to-one',
      author: 'Peter Thiel',
      format: 'summary',
      status: 'draft',
    }),
  };

  const createMockModel = () => {
    const fn = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      _id: validBookId,
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: validBookId,
      }),
    })) as unknown as Record<string, jest.Mock>;

    fn.find = jest.fn();
    fn.findById = jest.fn();
    fn.findOne = jest.fn();
    fn.findByIdAndDelete = jest.fn();
    fn.countDocuments = jest.fn();
    fn.updateMany = jest.fn();
    fn.deleteMany = jest.fn();
    return fn;
  };

  let bookModelMock: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    bookModelMock = createMockModel();
    service = new AdminBooksService(bookModelMock as never);
  });

  describe('slugify', () => {
    it('should generate URL-friendly slug', () => {
      expect(slugify('The Hard Thing About Hard Things!')).toBe('the-hard-thing-about-hard-things');
    });
  });

  describe('listBooks', () => {
    it('should query books with pagination and filters', async () => {
      const execMock = jest.fn().mockResolvedValue([mockBook]);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

      bookModelMock.find.mockReturnValue({ populate: populateMock });
      bookModelMock.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const res = await service.listBooks({
        page: 1,
        limit: 10,
        status: 'published',
        format: 'summary',
        isFree: true,
        search: 'Zero',
      });

      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
      expect(bookModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          format: 'summary',
          isFree: true,
        }),
      );
    });
  });

  describe('getBookById', () => {
    it('should return book if found', async () => {
      bookModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockBook),
        }),
      });

      const res = await service.getBookById(validBookId);
      expect(res.id).toBe(validBookId);
      expect(res.title).toBe('Zero to One');
    });

    it('should throw NotFoundException on non-existent book', async () => {
      bookModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getBookById(validBookId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBook', () => {
    it('should create book with auto-generated slug', async () => {
      bookModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const created = await service.createBook({
        title: 'Blitzscaling',
        author: 'Reid Hoffman',
        coverUrl: 'https://images.example.com/blitz.jpg',
        format: 'pdf',
        fileUrl: 'https://files.example.com/blitz.pdf',
      });

      expect(created).toBeDefined();
    });

    it('should throw ConflictException on slug collision', async () => {
      bookModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBook),
      });

      await expect(
        service.createBook({
          title: 'Zero to One',
          author: 'Peter Thiel',
          coverUrl: 'https://images.example.com/zero.jpg',
          format: 'summary',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if title is missing', async () => {
      await expect(
        service.createBook({
          title: '',
          author: 'Peter Thiel',
          coverUrl: 'https://images.example.com/zero.jpg',
          format: 'summary',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateBook', () => {
    it('should update book fields', async () => {
      bookModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockBook,
          save: jest.fn().mockResolvedValue(mockBook),
        }),
      });

      const updated = await service.updateBook(validBookId, {
        title: 'Zero to One: 2nd Edition',
        isFree: false,
        priceInr: 499,
      });

      expect(updated).toBeDefined();
    });
  });

  describe('deleteBook', () => {
    it('should delete book', async () => {
      bookModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBook),
      });
      bookModelMock.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBook),
      });

      const res = await service.deleteBook(validBookId);
      expect(res.success).toBe(true);
    });
  });

  describe('publishBook and unpublishBook', () => {
    it('should set status to published', async () => {
      const bookInstance = {
        ...mockBook,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      bookModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bookInstance),
      });

      const published = await service.publishBook(validBookId);
      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeDefined();
    });

    it('should revert status to draft on unpublish', async () => {
      const bookInstance = {
        ...mockBook,
        status: 'published',
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      bookModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bookInstance),
      });

      const draft = await service.unpublishBook(validBookId);
      expect(draft.status).toBe('draft');
    });
  });

  describe('bulkAction', () => {
    it('should archive selected books', async () => {
      bookModelMock.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
      });

      const res = await service.bulkAction([validBookId], 'archive');
      expect(res.modifiedCount).toBe(2);
    });

    it('should delete selected books', async () => {
      bookModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 3 }),
      });

      const res = await service.bulkAction([validBookId], 'delete');
      expect(res.modifiedCount).toBe(3);
    });
  });
});
