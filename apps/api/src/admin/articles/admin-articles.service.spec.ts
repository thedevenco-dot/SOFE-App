import { Types } from 'mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  AdminArticlesService,
  slugify,
  calculateReadTime,
  sanitizeHtml,
} from './admin-articles.service';

describe('AdminArticlesService', () => {
  let service: AdminArticlesService;

  const validArticleId = new Types.ObjectId().toHexString();
  const validTopicId = new Types.ObjectId().toHexString();
  const validAuthorId = new Types.ObjectId().toHexString();
  const validAdminId = new Types.ObjectId().toHexString();

  const mockArticle = {
    _id: validArticleId,
    title: 'How to Raise Seed Capital in India',
    slug: 'how-to-raise-seed-capital-in-india',
    excerpt: 'A comprehensive guide to fundraising from angel networks and micro VCs.',
    bodyHtml: '<p>Fundraising is a structured sprint requiring preparation and storytelling.</p>',
    coverUrl: 'https://images.example.com/cover.jpg',
    primaryTopicId: new Types.ObjectId(validTopicId),
    topicIds: [new Types.ObjectId(validTopicId)],
    authorId: new Types.ObjectId(validAuthorId),
    readTimeMin: 4,
    status: 'draft',
    featured: false,
    version: 1,
    stats: { views: 120, bookmarks: 15 },
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockReturnValue({
      _id: validArticleId,
      title: 'How to Raise Seed Capital in India',
      slug: 'how-to-raise-seed-capital-in-india',
      status: 'draft',
      version: 1,
    }),
  };

  const createMockModel = () => {
    const fn = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      _id: validArticleId,
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: validArticleId,
      }),
    })) as unknown as Record<string, jest.Mock>;

    fn.find = jest.fn();
    fn.findById = jest.fn();
    fn.findOne = jest.fn();
    fn.findByIdAndDelete = jest.fn();
    fn.countDocuments = jest.fn();
    fn.updateMany = jest.fn();
    return fn;
  };

  let articleModelMock: ReturnType<typeof createMockModel>;
  let contentVersionModelMock: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    articleModelMock = createMockModel();
    contentVersionModelMock = createMockModel();

    service = new AdminArticlesService(articleModelMock as never, contentVersionModelMock as never);
  });

  describe('Utility Functions', () => {
    it('slugify converts titles into clean url slugs', () => {
      expect(slugify('How to Raise $1M in Seed Capital!')).toBe('how-to-raise-1m-in-seed-capital');
      expect(slugify('  SAFE vs Convertible Note -- 2026   ')).toBe(
        'safe-vs-convertible-note-2026',
      );
    });

    it('sanitizeHtml strips script tags and inline event handlers', () => {
      const dirty = '<p>Hello</p><script>alert("xss")</script><img src="x" onerror="steal()" />';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('<p>Hello</p>');
    });

    it('calculateReadTime calculates minutes based on 200 words per minute', () => {
      const words100 = '<p>' + 'word '.repeat(100) + '</p>';
      expect(calculateReadTime(words100)).toBe(1);

      const words500 = '<p>' + 'word '.repeat(500) + '</p>';
      expect(calculateReadTime(words500)).toBe(3);
    });
  });

  describe('listArticles', () => {
    it('should query articles with filters and pagination', async () => {
      const execCount = jest.fn().mockResolvedValue(1);
      const execFind = jest.fn().mockResolvedValue([mockArticle]);

      articleModelMock.countDocuments.mockReturnValue({ exec: execCount });
      articleModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  exec: execFind,
                }),
              }),
            }),
          }),
        }),
      });

      const res = await service.listArticles({ page: 1, limit: 10, status: 'draft' });
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe(validArticleId);
      expect(res.meta.total).toBe(1);
    });
  });

  describe('getArticleById', () => {
    it('should return article with populated topics and author', async () => {
      articleModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockArticle),
            }),
          }),
        }),
      });

      const res = await service.getArticleById(validArticleId);
      expect(res.id).toBe(validArticleId);
      expect(res.title).toBe(mockArticle.title);
    });

    it('should throw NotFoundException if article not found or invalid id', async () => {
      await expect(service.getArticleById('invalid-id')).rejects.toThrow(NotFoundException);

      articleModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });
      await expect(service.getArticleById(validArticleId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createArticle', () => {
    it('should create article with sanitized body and computed read time', async () => {
      articleModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const created = await service.createArticle({
        title: 'Top 10 Due Diligence Red Flags',
        excerpt: 'Avoid these critical missteps.',
        bodyHtml: '<p>' + 'word '.repeat(400) + '</p>',
        primaryTopicId: validTopicId,
        authorId: validAuthorId,
      });

      expect(created).toBeDefined();
    });

    it('should throw ConflictException on slug collision', async () => {
      articleModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArticle),
      });

      await expect(
        service.createArticle({
          title: 'How to Raise Seed Capital in India',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateArticle', () => {
    it('should update article fields', async () => {
      articleModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockArticle,
          save: jest.fn().mockResolvedValue(mockArticle),
        }),
      });

      const updated = await service.updateArticle(validArticleId, {
        title: 'Updated Title',
        featured: true,
      });

      expect(updated).toBeDefined();
    });
  });

  describe('publishArticle & unpublishArticle', () => {
    it('should publish article and record a contentVersion snapshot', async () => {
      const articleToPublish = {
        ...mockArticle,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };

      articleModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(articleToPublish),
      });

      const published = await service.publishArticle(validArticleId, validAdminId);
      expect(published.status).toBe('published');
      expect(contentVersionModelMock).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'article',
          version: 2,
        }),
      );
    });

    it('should revert article back to draft status', async () => {
      const articleToUnpublish = {
        ...mockArticle,
        status: 'published',
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };

      articleModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(articleToUnpublish),
      });

      const unpublished = await service.unpublishArticle(validArticleId);
      expect(unpublished.status).toBe('draft');
    });
  });

  describe('scheduleArticle & toggleFeatured', () => {
    it('should schedule article for future date', async () => {
      const articleToSchedule = {
        ...mockArticle,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };

      articleModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(articleToSchedule),
      });

      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const scheduled = await service.scheduleArticle(validArticleId, futureDate);
      expect(scheduled.status).toBe('scheduled');
    });

    it('should toggle featured boolean', async () => {
      const articleToToggle = {
        ...mockArticle,
        featured: false,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };

      articleModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(articleToToggle),
      });

      const toggled = await service.toggleFeatured(validArticleId);
      expect(toggled.featured).toBe(true);
    });
  });

  describe('bulkAction', () => {
    it('should perform bulk archive or feature update', async () => {
      articleModelMock.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      const res = await service.bulkAction([validArticleId], 'feature');
      expect(res.success).toBe(true);
      expect(res.modifiedCount).toBe(3);
    });
  });
});
