import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentService, encodeCursor, decodeCursor } from './content.service';

describe('ContentService (Public Content Engine - T2.9)', () => {
  let service: ContentService;

  const validCourseId = new Types.ObjectId().toHexString();
  const validCategoryId = new Types.ObjectId().toHexString();
  const validLessonId = new Types.ObjectId().toHexString();
  const validArticleId = new Types.ObjectId().toHexString();
  const validTopicId = new Types.ObjectId().toHexString();
  const validAuthorId = new Types.ObjectId().toHexString();
  const validBookId = new Types.ObjectId().toHexString();
  const validVideoId = new Types.ObjectId().toHexString();

  const mockCourse = {
    _id: validCourseId,
    title: 'Founders Bootcamp: 0 to 1',
    slug: 'founders-bootcamp-0-to-1',
    subtitle: 'Step by step guide',
    status: 'published',
    level: 'beginner',
    pricing: { isFree: true, priceInr: 0 },
    categoryId: new Types.ObjectId(validCategoryId),
    instructors: [new Types.ObjectId()],
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Ideation',
        order: 1,
        lessonIds: [new Types.ObjectId(validLessonId)],
      },
    ],
    toObject: jest.fn().mockReturnValue({
      _id: validCourseId,
      title: 'Founders Bootcamp: 0 to 1',
      slug: 'founders-bootcamp-0-to-1',
      status: 'published',
    }),
  };

  const mockCategory = {
    _id: validCategoryId,
    name: 'Fundraising',
    slug: 'fundraising',
    order: 1,
    toObject: jest.fn().mockReturnValue({
      _id: validCategoryId,
      name: 'Fundraising',
      slug: 'fundraising',
    }),
  };

  const mockLesson = {
    _id: validLessonId,
    title: 'Welcome to Founders Bootcamp',
    type: 'video',
    durationSec: 360,
    order: 1,
    isFreePreview: true,
    isRequired: true,
    status: 'published',
  };

  const mockArticle = {
    _id: validArticleId,
    title: 'SAFE Notes Explained for Indian Founders',
    slug: 'safe-notes-explained',
    excerpt: 'Everything you need to know about iSAFEs.',
    status: 'published',
    featured: true,
    publishedAt: new Date('2026-10-15T10:00:00.000Z'),
    primaryTopicId: new Types.ObjectId(validTopicId),
    authorId: new Types.ObjectId(validAuthorId),
    stats: { views: 100 },
    toObject: jest.fn().mockReturnValue({
      _id: validArticleId,
      title: 'SAFE Notes Explained for Indian Founders',
      slug: 'safe-notes-explained',
      status: 'published',
    }),
  };

  const mockTopic = {
    _id: validTopicId,
    name: 'Fundraising',
    slug: 'fundraising',
    isTab: true,
    order: 1,
    toObject: jest.fn().mockReturnValue({
      _id: validTopicId,
      name: 'Fundraising',
      slug: 'fundraising',
    }),
  };

  const mockAuthor = {
    _id: validAuthorId,
    name: 'Naveen Jain',
    title: 'Managing Partner',
    toObject: jest.fn().mockReturnValue({
      _id: validAuthorId,
      name: 'Naveen Jain',
      title: 'Managing Partner',
    }),
  };

  const mockBook = {
    _id: validBookId,
    title: 'Zero to One',
    slug: 'zero-to-one',
    author: 'Peter Thiel',
    format: 'summary',
    isFree: true,
    status: 'published',
    publishedAt: new Date('2026-10-15T10:00:00.000Z'),
    toObject: jest.fn().mockReturnValue({
      _id: validBookId,
      title: 'Zero to One',
      slug: 'zero-to-one',
      status: 'published',
    }),
  };

  const mockVideo = {
    _id: validVideoId,
    title: 'Pitching Your Startup',
    slug: 'pitching-your-startup',
    durationSec: 600,
    isFree: true,
    status: 'published',
    publishedAt: new Date('2026-10-15T10:00:00.000Z'),
    mux: { playbackId: 'pb-123' },
    toObject: jest.fn().mockReturnValue({
      _id: validVideoId,
      title: 'Pitching Your Startup',
      slug: 'pitching-your-startup',
      status: 'published',
    }),
  };

  const createMockModel = () => {
    const fn = jest.fn() as unknown as Record<string, jest.Mock>;
    fn.find = jest.fn();
    fn.findById = jest.fn();
    fn.findOne = jest.fn();
    fn.countDocuments = jest.fn();
    fn.updateOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    return fn;
  };

  let courseModelMock: ReturnType<typeof createMockModel>;
  let categoryModelMock: ReturnType<typeof createMockModel>;
  let lessonModelMock: ReturnType<typeof createMockModel>;
  let articleModelMock: ReturnType<typeof createMockModel>;
  let topicModelMock: ReturnType<typeof createMockModel>;
  let authorModelMock: ReturnType<typeof createMockModel>;
  let bookModelMock: ReturnType<typeof createMockModel>;
  let videoModelMock: ReturnType<typeof createMockModel>;
  let bookmarkModelMock: ReturnType<typeof createMockModel>;
  let topicFollowModelMock: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    courseModelMock = createMockModel();
    categoryModelMock = createMockModel();
    lessonModelMock = createMockModel();
    articleModelMock = createMockModel();
    topicModelMock = createMockModel();
    authorModelMock = createMockModel();
    bookModelMock = createMockModel();
    videoModelMock = createMockModel();
    bookmarkModelMock = createMockModel();
    topicFollowModelMock = createMockModel();

    service = new ContentService(
      courseModelMock as never,
      categoryModelMock as never,
      lessonModelMock as never,
      articleModelMock as never,
      topicModelMock as never,
      authorModelMock as never,
      bookModelMock as never,
      videoModelMock as never,
      bookmarkModelMock as never,
      topicFollowModelMock as never,
    );
  });

  describe('Cursor Pagination Helpers', () => {
    it('should encode and decode cursor payload accurately', () => {
      const doc = { _id: validCourseId, createdAt: '2026-10-20T10:00:00.000Z' };
      const cursor = encodeCursor(doc);
      expect(typeof cursor).toBe('string');

      const decoded = decodeCursor(cursor);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(validCourseId);
      expect(decoded?.createdAt.toISOString()).toBe(
        new Date('2026-10-20T10:00:00.000Z').toISOString(),
      );
    });
  });

  describe('Courses & Categories', () => {
    it('should list only published courses with filters and cursor pagination', async () => {
      const execMock = jest.fn().mockResolvedValue([mockCourse]);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populate2 = jest.fn().mockReturnValue({ sort: sortMock });
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });

      courseModelMock.find.mockReturnValue({ populate: populate1 });
      courseModelMock.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const res = await service.listCourses({
        limit: 10,
        level: 'beginner',
        price: 'free',
        q: 'Bootcamp',
      });

      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
      expect(courseModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          level: 'beginner',
        }),
      );
    });

    it('should get course categories sorted', async () => {
      categoryModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockCategory]),
        }),
      });

      const categories = await service.getCourseCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Fundraising');
    });

    it('should return published course detail and sanitized curriculum outline', async () => {
      const populateInstructors = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourse),
      });
      const populateCat = jest.fn().mockReturnValue({
        populate: populateInstructors,
      });
      courseModelMock.findOne.mockReturnValue({
        populate: populateCat,
      });

      lessonModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockLesson]),
          }),
        }),
      });

      const res = await service.getCourseBySlug('founders-bootcamp-0-to-1');
      expect(res.id).toBe(validCourseId);
      expect(res.modules).toHaveLength(1);
      const mod = (res.modules as { lessons: unknown[] }[])[0];
      expect(mod.lessons).toHaveLength(1);
    });

    it('should throw NotFoundException if course does not exist or is not published', async () => {
      courseModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.getCourseBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Articles, Topics & Authors', () => {
    it('should list only published articles and populate topics and author', async () => {
      const execMock = jest.fn().mockResolvedValue([mockArticle]);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const pop3 = jest.fn().mockReturnValue({ sort: sortMock });
      const pop2 = jest.fn().mockReturnValue({ populate: pop3 });
      const pop1 = jest.fn().mockReturnValue({ populate: pop2 });

      articleModelMock.find.mockReturnValue({ populate: pop1 });
      articleModelMock.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const res = await service.listArticles({ limit: 10, topic: validTopicId });
      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
      expect(articleModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' }),
      );
    });

    it('should return Startup World feed (featured, recent, topics tabs)', async () => {
      const setupFindChain = (items: unknown[]) => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(items),
              }),
            }),
          }),
        }),
      });

      articleModelMock.find
        .mockReturnValueOnce(setupFindChain([mockArticle]))
        .mockReturnValueOnce(setupFindChain([mockArticle]));

      topicModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTopic]),
        }),
      });

      const feed = await service.getArticlesFeed();
      expect(feed.featured).toHaveLength(1);
      expect(feed.recent).toHaveLength(1);
      expect(feed.topics).toHaveLength(1);
    });

    it('should get published article by slug and increment view count', async () => {
      const pop3 = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArticle),
      });
      const pop2 = jest.fn().mockReturnValue({ populate: pop3 });
      const pop1 = jest.fn().mockReturnValue({ populate: pop2 });
      articleModelMock.findOne.mockReturnValue({ populate: pop1 });

      const res = await service.getArticleBySlug('safe-notes-explained');
      expect(res.id).toBe(validArticleId);
      expect(articleModelMock.updateOne).toHaveBeenCalledWith(
        { _id: mockArticle._id },
        { $inc: { 'stats.views': 1 } },
      );
    });

    it('should list topics and support isTabOnly filter', async () => {
      topicModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTopic]),
        }),
      });

      const tabs = await service.listTopics(true);
      expect(tabs).toHaveLength(1);
      expect(topicModelMock.find).toHaveBeenCalledWith({ isTab: true });
    });

    it('should get author by ID with their published articles', async () => {
      authorModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAuthor),
      });
      articleModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockArticle]),
            }),
          }),
        }),
      });

      const res = await service.getAuthorById(validAuthorId);
      expect(res.id).toBe(validAuthorId);
      expect(res.articles).toHaveLength(1);
    });
  });

  describe('Books & Standalone Videos', () => {
    it('should list published books', async () => {
      const execMock = jest.fn().mockResolvedValue([mockBook]);
      bookModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ exec: execMock }),
          }),
        }),
      });
      bookModelMock.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const res = await service.listBooks({ limit: 10, format: 'summary', price: 'free' });
      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
    });

    it('should get published book by slug', async () => {
      bookModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockBook),
        }),
      });

      const res = await service.getBookBySlug('zero-to-one');
      expect(res.id).toBe(validBookId);
    });

    it('should list published standalone videos', async () => {
      const execMock = jest.fn().mockResolvedValue([mockVideo]);
      videoModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ exec: execMock }),
          }),
        }),
      });
      videoModelMock.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const res = await service.listVideos({ limit: 10 });
      expect(res.data).toHaveLength(1);
    });

    it('should get published video by slug', async () => {
      videoModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockVideo),
        }),
      });

      const res = await service.getVideoBySlug('pitching-your-startup');
      expect(res.id).toBe(validVideoId);
    });
  });

  describe('Unified Search', () => {
    it('should search across published courses, articles, books, and videos', async () => {
      const makeSearchChain = (items: unknown[]) => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(items),
              }),
            }),
          }),
        }),
      });

      courseModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockCourse]) }),
          }),
        }),
      });
      articleModelMock.find.mockReturnValue(makeSearchChain([mockArticle]));
      bookModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockBook]) }),
          }),
        }),
      });
      videoModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockVideo]) }),
          }),
        }),
      });

      const res = await service.search({ q: 'startup' });
      expect(res.meta.total).toBe(4);
      expect(res.data.courses).toHaveLength(1);
      expect(res.data.articles).toHaveLength(1);
      expect(res.data.books).toHaveLength(1);
      expect(res.data.videos).toHaveLength(1);
    });

    it('should throw BadRequestException if search query q is empty', async () => {
      await expect(service.search({ q: '' })).rejects.toThrow(BadRequestException);
    });
  });
});
