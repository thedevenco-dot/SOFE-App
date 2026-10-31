import { Types } from 'mongoose';
import { AdminArticlesController } from './admin-articles.controller';
import { AdminArticlesService } from './admin-articles.service';
import { AdminUserDocument } from '../../database/schemas/admin-user.schema';

describe('AdminArticlesController', () => {
  let controller: AdminArticlesController;
  let serviceMock: jest.Mocked<Partial<AdminArticlesService>>;

  const validId = new Types.ObjectId().toHexString();
  const validAdmin = {
    _id: new Types.ObjectId(),
    name: 'Admin Tester',
    email: 'admin@sofe.org',
    role: 'superadmin',
  } as unknown as AdminUserDocument;

  beforeEach(() => {
    serviceMock = {
      listArticles: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      }),
      getArticleById: jest
        .fn()
        .mockResolvedValue({ id: validId, title: 'Sample Article' } as never),
      createArticle: jest
        .fn()
        .mockResolvedValue({ id: validId, title: 'Created Article' } as never),
      updateArticle: jest
        .fn()
        .mockResolvedValue({ id: validId, title: 'Updated Article' } as never),
      deleteArticle: jest.fn().mockResolvedValue({ success: true, message: 'Article deleted' }),
      publishArticle: jest.fn().mockResolvedValue({ id: validId, status: 'published' } as never),
      unpublishArticle: jest.fn().mockResolvedValue({ id: validId, status: 'draft' } as never),
      scheduleArticle: jest.fn().mockResolvedValue({ id: validId, status: 'scheduled' } as never),
      toggleFeatured: jest.fn().mockResolvedValue({ id: validId, featured: true } as never),
      bulkAction: jest.fn().mockResolvedValue({ success: true, modifiedCount: 2 }),
    };

    controller = new AdminArticlesController(serviceMock as AdminArticlesService);
  });

  it('should list articles with query filters', async () => {
    const res = await controller.listArticles({ page: 1, limit: 10, status: 'published' });
    expect(res).toBeDefined();
    expect(serviceMock.listArticles).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: 'published',
    });
  });

  it('should get article by id', async () => {
    const res = await controller.getArticleById(validId);
    expect(res).toBeDefined();
    expect(serviceMock.getArticleById).toHaveBeenCalledWith(validId);
  });

  it('should create article', async () => {
    const dto = { title: 'New Article' };
    const res = await controller.createArticle(dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.createArticle).toHaveBeenCalledWith(dto, validAdmin._id.toString());
  });

  it('should update article', async () => {
    const dto = { title: 'Updated Article' };
    const res = await controller.updateArticle(validId, dto, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.updateArticle).toHaveBeenCalledWith(validId, dto, validAdmin._id.toString());
  });

  it('should delete article', async () => {
    const res = await controller.deleteArticle(validId, validAdmin);
    expect(res.success).toBe(true);
    expect(serviceMock.deleteArticle).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should publish article', async () => {
    const res = await controller.publishArticle(validId, validAdmin);
    expect(res).toBeDefined();
    expect(serviceMock.publishArticle).toHaveBeenCalledWith(validId, validAdmin._id.toString());
  });

  it('should unpublish article', async () => {
    const res = await controller.unpublishArticle(validId);
    expect(res).toBeDefined();
    expect(serviceMock.unpublishArticle).toHaveBeenCalledWith(validId);
  });

  it('should schedule article', async () => {
    const res = await controller.scheduleArticle(validId, { scheduledAt: '2026-11-15T10:00:00Z' });
    expect(res).toBeDefined();
    expect(serviceMock.scheduleArticle).toHaveBeenCalledWith(validId, '2026-11-15T10:00:00Z');
  });

  it('should toggle featured', async () => {
    const res = await controller.toggleFeatured(validId);
    expect(res).toBeDefined();
    expect(serviceMock.toggleFeatured).toHaveBeenCalledWith(validId);
  });

  it('should perform bulk actions', async () => {
    const res = await controller.bulkAction({ ids: [validId], action: 'feature' });
    expect(res.success).toBe(true);
    expect(serviceMock.bulkAction).toHaveBeenCalledWith([validId], 'feature');
  });
});
