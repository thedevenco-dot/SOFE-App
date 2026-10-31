import { Types } from 'mongoose';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

describe('AdminBooksController', () => {
  let controller: AdminBooksController;
  let serviceMock: Record<string, jest.Mock>;

  const validId = new Types.ObjectId().toHexString();
  const validAdmin = {
    _id: new Types.ObjectId(),
    email: 'admin@sofe.org',
    roles: ['super_admin'],
  } as unknown as AdminUserDocument;

  beforeEach(() => {
    serviceMock = {
      listBooks: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getBookById: jest.fn().mockResolvedValue({ id: validId, title: 'Sample Book' }),
      createBook: jest.fn().mockResolvedValue({ _id: validId, title: 'New Book' }),
      updateBook: jest.fn().mockResolvedValue({ _id: validId, title: 'Updated Book' }),
      deleteBook: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      publishBook: jest.fn().mockResolvedValue({ _id: validId, status: 'published' }),
      unpublishBook: jest.fn().mockResolvedValue({ _id: validId, status: 'draft' }),
      bulkAction: jest.fn().mockResolvedValue({ success: true, modifiedCount: 1 }),
    };

    controller = new AdminBooksController(serviceMock as unknown as AdminBooksService);
  });

  it('should list books', async () => {
    const res = await controller.listBooks({ page: 1, limit: 10 });
    expect(res).toBeDefined();
    expect(serviceMock.listBooks).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('should get book by ID', async () => {
    const res = await controller.getBookById(validId);
    expect(res).toBeDefined();
    expect(serviceMock.getBookById).toHaveBeenCalledWith(validId);
  });

  it('should create book', async () => {
    const dto = {
      title: 'New Book',
      author: 'Author Name',
      coverUrl: 'https://images.example.com/cover.jpg',
      format: 'summary' as const,
    };
    const res = await controller.createBook(dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.createBook).toHaveBeenCalledWith(dto, validAdmin._id.toString());
  });

  it('should update book', async () => {
    const dto = { title: 'Updated Book' };
    const res = await controller.updateBook(validId, dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.updateBook).toHaveBeenCalledWith(validId, dto, validAdmin._id.toString());
  });

  it('should delete book', async () => {
    const res = await controller.deleteBook(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.deleteBook).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should publish book', async () => {
    const res = await controller.publishBook(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.publishBook).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should unpublish book', async () => {
    const res = await controller.unpublishBook(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.unpublishBook).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should perform bulk action', async () => {
    const res = await controller.bulkAction({ ids: [validId], action: 'archive' });
    expect(res).toBeDefined();
    expect(serviceMock.bulkAction).toHaveBeenCalledWith([validId], 'archive');
  });
});
